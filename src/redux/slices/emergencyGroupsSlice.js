// src/redux/slices/emergencyGroupsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

// ── دالة مساعدة لتطبيع بيانات الغروب (رسمي أو معلق) ──
const normalizeGroupData = (data) => {
  if (!data) return null;

  // إذا كانت البيانات مباشرة من API (بدون غلاف data)
  const payload = data.data || data;

  if (payload.type === 'official' && payload.group) {
    const group = payload.group;
    return {
      type: 'official',
      group_id: group.id,
      group_name: group.name,
      chat_id: payload.chat_id,
      center: [group.center_lat, group.center_lng],
      radius_km: group.radius_km,
      is_active: group.is_active,
      membership: payload.membership,
    };
  }

  if (payload.type === 'pending' && payload.pending_group) {
    const pending = payload.pending_group;
    return {
      type: 'pending',
      group_id: pending.id,
      group_name: `غروب قيد الانتظار (${pending.nearby_users_count || 0} مستخدم)`,
      chat_id: null,
      center: [pending.center_lat, pending.center_lng],
      radius_km: pending.radius_km,
      status: pending.status,
      nearby_users_count: pending.nearby_users_count,
      membership: payload.membership,
    };
  }

  // إذا لم يكن هناك نوع معروف، نحاول استخراج البيانات من group أو pending_group مباشرة
  if (payload.group) {
    const group = payload.group;
    return {
      type: 'official',
      group_id: group.id,
      group_name: group.name,
      chat_id: payload.chat_id,
      center: [group.center_lat, group.center_lng],
      radius_km: group.radius_km,
      is_active: group.is_active,
      membership: payload.membership,
    };
  }

  if (payload.pending_group) {
    const pending = payload.pending_group;
    return {
      type: 'pending',
      group_id: pending.id,
      group_name: `غروب قيد الانتظار (${pending.nearby_users_count || 0} مستخدم)`,
      chat_id: null,
      center: [pending.center_lat, pending.center_lng],
      radius_km: pending.radius_km,
      status: pending.status,
      nearby_users_count: pending.nearby_users_count,
      membership: payload.membership,
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
      // إذا كان الخطأ 404، نعتبره حالة طبيعية (لا يوجد غروب)
      if (err.status === 404 || err.message?.includes('404')) {
        return null;
      }
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
  groupError: null, // ✅ خطأ خاص بجلب الغروب
  gpsLocation: null,
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
    clearError: (state) => { state.error = null; state.groupError = null; },
    clearCurrentGroup: (state) => { state.currentGroup = null; },
    setGpsLocation: (state, action) => {
      state.gpsLocation = action.payload; // يتوقع مصفوفة [lat, lng]
    },
    clearGpsLocation: (state) => {
      state.gpsLocation = null;
    },
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
        if (payload.status === 'already_member' && payload.group_id) {
          state.currentGroup = {
            group_id: payload.group_id,
            chat_id: payload.chat_id,
            group_name: payload.group_name || 'غروب',
            type: 'official',
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
        state.currentGroup = normalizeGroupData(payload);
        state.searchResult = null;
        state.officialGroupsList = [];
        state.pendingGroupsList = [];
        state.groupError = null;
      })
      .addCase(confirmOfficialJoin.rejected, (state, { payload }) => {
        state.joining = false;
        state.error = payload;
      })

      // ── confirmPendingJoin ──
      .addCase(confirmPendingJoin.pending, (state) => { state.joining = true; })
      .addCase(confirmPendingJoin.fulfilled, (state, { payload }) => {
        state.joining = false;
        state.currentGroup = normalizeGroupData(payload);
        state.searchResult = null;
        state.officialGroupsList = [];
        state.pendingGroupsList = [];
        state.groupError = null;
      })
      .addCase(confirmPendingJoin.rejected, (state, { payload }) => {
        state.joining = false;
        state.error = payload;
      })

      // ── confirmCreateNewPending ──
      .addCase(confirmCreateNewPending.pending, (state) => { state.joining = true; })
      .addCase(confirmCreateNewPending.fulfilled, (state, { payload }) => {
        state.joining = false;
        state.currentGroup = normalizeGroupData(payload);
        state.searchResult = null;
        state.officialGroupsList = [];
        state.pendingGroupsList = [];
        state.groupError = null;
      })
      .addCase(confirmCreateNewPending.rejected, (state, { payload }) => {
        state.joining = false;
        state.error = payload;
      })

      // ── fetchMyGroup ──
      .addCase(fetchMyGroup.pending, (state) => {
        state.loading = true;
        state.groupError = null;
      })
      .addCase(fetchMyGroup.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.currentGroup = normalizeGroupData(payload);
        state.groupError = null;
        console.log('✅ fetchMyGroup success:', state.currentGroup);
      })
      .addCase(fetchMyGroup.rejected, (state, { payload }) => {
        state.loading = false;
        state.currentGroup = null;
        state.groupError = payload || 'فشل جلب الغروب';
        console.warn('⚠️ fetchMyGroup failed:', payload);
      });
  },
});

export const { clearSearchResult, clearError, clearCurrentGroup, setGpsLocation, clearGpsLocation } = emergencyGroupsSlice.actions;
export default emergencyGroupsSlice.reducer;