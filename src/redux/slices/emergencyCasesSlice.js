// src/redux/slices/emergencyCasesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

// ─── Thunks ──────────────────────────────────────────────────────

export const fetchMyActiveCase = createAsyncThunk(
  'emergencyCases/fetchMy',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyActiveCase(token);
      return response; // قد يكون null أو { data: {...} }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const resolveMyCase = createAsyncThunk(
  'emergencyCases/resolveMy',
  async (emergencyId = null, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      let response;
      if (emergencyId) {
        // إذا تم تمرير emergencyId، نستخدم resolveCase (لإنهاء حالة محددة)
        response = await emergencyApi.resolveCase(token, emergencyId);
      } else {
        // وإلا نستخدم resolveMyCase (لإنهاء الحالة النشطة)
        response = await emergencyApi.resolveMyCase(token);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCaseDetail = createAsyncThunk(
  'emergencyCases/detail',
  async (emergencyId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getCaseDetail(token, emergencyId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const resolveCase = createAsyncThunk(
  'emergencyCases/resolve',
  async (emergencyId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.resolveCase(token, emergencyId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyActiveStatus = createAsyncThunk(
  'emergencyCases/fetchActiveStatus',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyActiveStatus(token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyReports = createAsyncThunk(
  'emergencyCases/fetchMyReports',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyReports(token, params);
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyParticipations = createAsyncThunk(
  'emergencyCases/fetchMyParticipations',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyParticipations(token, params);
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchExploreCases = createAsyncThunk(
  'emergencyCases/fetchExplore',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getExploreCases(token, params);
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchReceivedRequests = createAsyncThunk(
  'emergencyCases/fetchReceivedRequests',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getRescueRequests(token, params);
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────

const initialState = {
  myCase: null,
  detail: null,
  loading: false,
  error: null,
  resolving: false,
  activeStatus: {
    has_active_emergency: false,
    active_role: 'NONE',
    active_emergency_id: null,
    can_join_other_emergencies: true,
  },
  myReports: {
    data: [],
    meta: { current_page: 1, last_page: 1, total: 0 },
    loading: false,
    error: null,
  },
  myParticipations: {
    data: [],
    meta: { current_page: 1, last_page: 1, total: 0 },
    loading: false,
    error: null,
  },
  explore: {
    data: [],
    meta: { current_page: 1, last_page: 1, total: 0 },
    loading: false,
    error: null,
  },
  receivedRequests: {
    data: [],
    meta: { current_page: 1, last_page: 1, total: 0 },
    loading: false,
    error: null,
  },
};

const emergencyCasesSlice = createSlice({
  name: 'emergencyCases',
  initialState,
  reducers: {
    clearMyCase: (state) => {
      state.myCase = null;
    },
    clearActiveStatus: (state) => {
      state.activeStatus = {
        has_active_emergency: false,
        active_role: 'NONE',
        active_emergency_id: null,
        can_join_other_emergencies: true,
      };
    },
    clearMyReports: (state) => {
      state.myReports = { data: [], meta: { current_page: 1, last_page: 1, total: 0 }, loading: false, error: null };
    },
    clearMyParticipations: (state) => {
      state.myParticipations = { data: [], meta: { current_page: 1, last_page: 1, total: 0 }, loading: false, error: null };
    },
    clearExplore: (state) => {
      state.explore = { data: [], meta: { current_page: 1, last_page: 1, total: 0 }, loading: false, error: null };
    },
    clearReceivedRequests: (state) => {
      state.receivedRequests = { data: [], meta: { current_page: 1, last_page: 1, total: 0 }, loading: false, error: null };
    },
    clearAllEmergencyData: (state) => {
      state.myCase = null;
      state.detail = null;
      state.loading = false;
      state.error = null;
      state.resolving = false;
      state.activeStatus = {
        has_active_emergency: false,
        active_role: 'NONE',
        active_emergency_id: null,
        can_join_other_emergencies: true,
      };
      state.myReports = { data: [], meta: { current_page: 1, last_page: 1, total: 0 }, loading: false, error: null };
      state.myParticipations = { data: [], meta: { current_page: 1, last_page: 1, total: 0 }, loading: false, error: null };
      state.explore = { data: [], meta: { current_page: 1, last_page: 1, total: 0 }, loading: false, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchMyActiveCase ──
      .addCase(fetchMyActiveCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyActiveCase.fulfilled, (state, { payload }) => {
        state.loading = false;
        // ✅ استخراج البيانات من داخل `data` إذا وجدت
        state.myCase = payload?.data || payload || null;
        state.error = null;
      })
      .addCase(fetchMyActiveCase.rejected, (state, { payload }) => {
        state.loading = false;
        state.myCase = null;
        if (payload && !payload.includes('404')) {
          state.error = payload;
        } else {
          state.error = null;
        }
      })
      // ── resolveMyCase ──
      .addCase(resolveMyCase.pending, (state) => {
        state.resolving = true;
      })
      .addCase(resolveMyCase.fulfilled, (state, { payload }) => {
        state.resolving = false;
        // ✅ استخراج البيانات من داخل `data` إذا وجدت
        state.myCase = payload?.data || payload || null;
        state.error = null;
      })
      .addCase(resolveMyCase.rejected, (state, { payload }) => {
        state.resolving = false;
        state.error = payload;
      })
      // ── fetchCaseDetail ──
      .addCase(fetchCaseDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCaseDetail.fulfilled, (state, { payload }) => {
        state.loading = false;
        // ✅ استخراج البيانات من داخل `data` إذا وجدت
        state.detail = payload?.data || payload || null;
        state.error = null;
      })
      .addCase(fetchCaseDetail.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.detail = null;
      })
      // ── resolveCase ──
      .addCase(resolveCase.pending, (state) => {
        state.resolving = true;
      })
      .addCase(resolveCase.fulfilled, (state, { payload }) => {
        state.resolving = false;
        // ✅ استخراج البيانات من داخل `data` إذا وجدت
        state.detail = payload?.data || payload || null;
      })
      .addCase(resolveCase.rejected, (state, { payload }) => {
        state.resolving = false;
        state.error = payload;
      })
      // ── fetchMyActiveStatus ──
      .addCase(fetchMyActiveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyActiveStatus.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.activeStatus = payload;
      })
      .addCase(fetchMyActiveStatus.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // ── fetchMyReports ──
      .addCase(fetchMyReports.pending, (state) => {
        state.myReports.loading = true;
        state.myReports.error = null;
      })
      .addCase(fetchMyReports.fulfilled, (state, { payload }) => {
        state.myReports.loading = false;
        state.myReports.data = payload.data || [];
        state.myReports.meta = payload.meta || { current_page: 1, last_page: 1, total: 0 };
      })
      .addCase(fetchMyReports.rejected, (state, { payload }) => {
        state.myReports.loading = false;
        state.myReports.error = payload;
        state.myReports.data = [];
      })
      // ── fetchMyParticipations ──
      .addCase(fetchMyParticipations.pending, (state) => {
        state.myParticipations.loading = true;
        state.myParticipations.error = null;
      })
      .addCase(fetchMyParticipations.fulfilled, (state, { payload }) => {
        state.myParticipations.loading = false;
        state.myParticipations.data = payload.data || [];
        state.myParticipations.meta = payload.meta || { current_page: 1, last_page: 1, total: 0 };
      })
      .addCase(fetchMyParticipations.rejected, (state, { payload }) => {
        state.myParticipations.loading = false;
        state.myParticipations.error = payload;
        state.myParticipations.data = [];
      })
      // ── fetchExploreCases ──
      .addCase(fetchExploreCases.pending, (state) => {
        state.explore.loading = true;
        state.explore.error = null;
      })
      .addCase(fetchExploreCases.fulfilled, (state, { payload }) => {
        state.explore.loading = false;
        state.explore.data = payload.data || [];
        state.explore.meta = payload.meta || { current_page: 1, last_page: 1, total: 0 };
      })
      .addCase(fetchExploreCases.rejected, (state, { payload }) => {
        state.explore.loading = false;
        state.explore.error = payload;
        state.explore.data = [];
      })
      // ── fetchReceivedRequests ──
      .addCase(fetchReceivedRequests.pending, (state) => {
        state.receivedRequests.loading = true;
        state.receivedRequests.error = null;
      })
      .addCase(fetchReceivedRequests.fulfilled, (state, { payload }) => {
        state.receivedRequests.loading = false;
        state.receivedRequests.data = payload.data || [];
        state.receivedRequests.meta = payload.meta || { current_page: 1, last_page: 1, total: 0 };
      })
      .addCase(fetchReceivedRequests.rejected, (state, { payload }) => {
        state.receivedRequests.loading = false;
        state.receivedRequests.error = payload;
        state.receivedRequests.data = [];
      });
  },
});

export const {
  clearMyCase,
  clearActiveStatus,
  clearMyReports,
  clearMyParticipations,
  clearExplore,
  clearAllEmergencyData,
  clearReceivedRequests,
} = emergencyCasesSlice.actions;

export default emergencyCasesSlice.reducer;