import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

// ── دالة مساعدة لتطبيع بيانات الغروب (رسمي أو معلق) ──
const normalizeGroupData = (data) => {
  // data هيكل الاستجابة من API: { type, group, pending_group, membership, chat_id }
  if (!data) return null;

  if (data.type === 'official' && data.group) {
    const group = data.group;
    return {
      type: 'official',
      group_id: group.id,
      group_name: group.name,
      chat_id: data.chat_id,
      center: [group.center_lat, group.center_lng],
      radius_km: group.radius_km,
      is_active: group.is_active,
      membership: data.membership,
    };
  }

  if (data.type === 'pending' && data.pending_group) {
    const pending = data.pending_group;
    return {
      type: 'pending',
      group_id: pending.id,
      group_name: `غروب قيد الانتظار (${pending.nearby_users_count || 0} مستخدم)`,
      chat_id: null,
      center: [pending.center_lat, pending.center_lng],
      radius_km: pending.radius_km,
      status: pending.status,
      nearby_users_count: pending.nearby_users_count,
      membership: data.membership,
    };
  }

  return null;
};

// ── Thunks ──
export const searchGroups = createAsyncThunk(
  'emergencyGroups/search',
  async ({ latitude, longitude, saveAsHome = false }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.searchGroups(token, latitude, longitude, saveAsHome);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const confirmOfficialJoin = createAsyncThunk(
  'emergencyGroups/confirmOfficial',
  async ({ groupId, latitude, longitude }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.confirmOfficialJoin(token, groupId, latitude, longitude);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const confirmPendingJoin = createAsyncThunk(
  'emergencyGroups/confirmPending',
  async ({ pendingGroupId, latitude, longitude }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.confirmPendingJoin(token, pendingGroupId, latitude, longitude);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const confirmCreateNewPending = createAsyncThunk(
  'emergencyGroups/confirmCreateNew',
  async ({ latitude, longitude }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.confirmCreateNewPending(token, latitude, longitude);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveHomeLocation = createAsyncThunk(
  'emergencyGroups/saveHome',
  async ({ homeLat, homeLng }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.saveHomeLocation(token, homeLat, homeLng);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyGroup = createAsyncThunk(
  'emergencyGroups/fetchMyGroup',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      if (!token) throw new Error('No token');
      const response = await emergencyApi.getMyGroup(token);
      // response = { data: { type, group/pending_group, membership, chat_id } }
      return response.data; 
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ──
const initialState = {
  currentGroup: null,
  searchResult: null,
  officialGroupsList: [],
  pendingGroupsList: [],
  loading: false,
  error: null,
  joining: false,
};

const emergencyGroupsSlice = createSlice({
  name: 'emergencyGroups',
  initialState,
  reducers: {
    clearSearchResult: (state) => {
      state.searchResult = null;
      state.officialGroupsList = [];
      state.pendingGroupsList = [];
    },
    clearError: (state) => { state.error = null; },
    clearCurrentGroup: (state) => { state.currentGroup = null; },
  },
  extraReducers: (builder) => {
    builder
      // ── searchGroups ──
      .addCase(searchGroups.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(searchGroups.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.searchResult = payload;
        state.officialGroupsList = payload.official_groups || [];
        state.pendingGroupsList = payload.pending_groups || [];
        // إذا كان المستخدم عضواً بالفعل، نضبط currentGroup من payload
        if (payload.status === 'already_member' && payload.group_id) {
          // يمكن أن يكون غروب رسمي أو معلق، لكن في هذه الحالة نعتمد على fetchMyGroup للحصول على التفاصيل
          // نترك currentGroup يُحدَّث عبر fetchMyGroup لاحقاً، أو نضبط مؤقتاً
          state.currentGroup = {
            group_id: payload.group_id,
            chat_id: payload.chat_id,
            group_name: payload.group_name || 'غروب',
            type: 'official', // افتراضي، سيتم تحديثه لاحقاً
          };
          state.searchResult = null;
          state.officialGroupsList = [];
          state.pendingGroupsList = [];
        }
      })
      .addCase(searchGroups.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // ── confirmOfficialJoin ──
      .addCase(confirmOfficialJoin.pending, (state) => { state.joining = true; })
      .addCase(confirmOfficialJoin.fulfilled, (state, { payload }) => {
        state.joining = false;
        state.currentGroup = normalizeGroupData(payload) || payload; // تطبيع البيانات
        state.searchResult = null;
        state.officialGroupsList = [];
        state.pendingGroupsList = [];
      })
      .addCase(confirmOfficialJoin.rejected, (state, { payload }) => {
        state.joining = false;
        state.error = payload;
      })

      // ── confirmPendingJoin ──
      .addCase(confirmPendingJoin.pending, (state) => { state.joining = true; })
      .addCase(confirmPendingJoin.fulfilled, (state, { payload }) => {
        state.joining = false;
        state.currentGroup = normalizeGroupData(payload) || payload;
        state.searchResult = null;
        state.officialGroupsList = [];
        state.pendingGroupsList = [];
      })
      .addCase(confirmPendingJoin.rejected, (state, { payload }) => {
        state.joining = false;
        state.error = payload;
      })

      // ── confirmCreateNewPending ──
      .addCase(confirmCreateNewPending.pending, (state) => { state.joining = true; })
      .addCase(confirmCreateNewPending.fulfilled, (state, { payload }) => {
        state.joining = false;
        state.currentGroup = normalizeGroupData(payload) || payload;
        state.searchResult = null;
        state.officialGroupsList = [];
        state.pendingGroupsList = [];
      })
      .addCase(confirmCreateNewPending.rejected, (state, { payload }) => {
        state.joining = false;
        state.error = payload;
      })

      // ── fetchMyGroup ──
      .addCase(fetchMyGroup.fulfilled, (state, { payload }) => {
        // تطبيع البيانات باستخدام الدالة المساعدة
        state.currentGroup = normalizeGroupData(payload);
      })
      .addCase(fetchMyGroup.rejected, (state) => {
        state.currentGroup = null;
      });
  },
});

export const { clearSearchResult, clearError, clearCurrentGroup } = emergencyGroupsSlice.actions;
export default emergencyGroupsSlice.reducer;