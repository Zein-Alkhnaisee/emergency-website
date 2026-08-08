// src/redux/slices/rescueRequestsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

// ── Thunks ──
export const fetchRescueRequests = createAsyncThunk(
  'rescueRequests/fetch',
  async ({ perPage = 15, pending = false, active = false } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getRescueRequests(token, { perPage, pending, active });
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchRescueRequestDetail = createAsyncThunk(
  'rescueRequests/detail',
  async (emergencyId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getRescueRequestDetail(token, emergencyId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const acceptRescueRequest = createAsyncThunk(
  'rescueRequests/accept',
  async (emergencyId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.acceptRescueRequest(token, emergencyId);
      return { emergencyId, data: response.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rejectRescueRequest = createAsyncThunk(
  'rescueRequests/reject',
  async (emergencyId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.rejectRescueRequest(token, emergencyId);
      return { emergencyId, data: response.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchUserNotifications = createAsyncThunk(
  'rescueRequests/userNotifications',
  async ({ perPage = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getUserNotificationsList(token, perPage);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markNotificationReadThunk = createAsyncThunk(
  'rescueRequests/markRead',
  async (notificationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.markNotificationRead(token, notificationId);
      return { notificationId, data: response.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ──
const initialState = {
  list: [],
  detail: null,
  meta: { current_page: 1, last_page: 1, total: 0 },
  loading: false,
  error: null,
  actionLoading: false,
  userNotifications: [],
  unreadCount: 0,
};

const rescueRequestsSlice = createSlice({
  name: 'rescueRequests',
  initialState,
  reducers: {
    clearDetail: (state) => { state.detail = null; },
    resetNotifications: (state) => {
      state.userNotifications = [];
      state.unreadCount = 0;
    },
    addNotificationRealtime: (state, action) => {
      const notif = action.payload;
      state.userNotifications.unshift(notif);
      if (!notif.is_read) state.unreadCount += 1;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchRescueRequests ──
      .addCase(fetchRescueRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRescueRequests.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.data || [];
        state.meta = payload.meta || { current_page: 1, last_page: 1, total: 0 };
        console.log('✅ fetchRescueRequests fulfilled:', payload);
      })
      .addCase(fetchRescueRequests.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.list = [];
      })
      // ── fetchRescueRequestDetail ──
      .addCase(fetchRescueRequestDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRescueRequestDetail.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.detail = payload;
      })
      .addCase(fetchRescueRequestDetail.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.detail = null;
      })
      // ── acceptRescueRequest ──
      .addCase(acceptRescueRequest.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(acceptRescueRequest.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.detail = payload.data;
        const idx = state.list.findIndex(r => r.id === payload.emergencyId);
        if (idx !== -1) {
          state.list[idx] = { ...state.list[idx], ...payload.data, can_respond: false };
          if (payload.data.notification) {
            state.list[idx].notification = payload.data.notification;
          }
        }
      })
      .addCase(acceptRescueRequest.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload;
      })
      // ── rejectRescueRequest ──
      .addCase(rejectRescueRequest.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(rejectRescueRequest.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.detail = payload.data;
        const idx = state.list.findIndex(r => r.id === payload.emergencyId);
        if (idx !== -1) {
          state.list[idx] = { ...state.list[idx], ...payload.data, can_respond: false };
          if (payload.data.notification) {
            state.list[idx].notification = payload.data.notification;
          }
        }
      })
      .addCase(rejectRescueRequest.rejected, (state, { payload }) => {
        state.actionLoading = false;
        state.error = payload;
      })
      // ── fetchUserNotifications ──
      .addCase(fetchUserNotifications.fulfilled, (state, { payload }) => {
        state.userNotifications = payload;
        state.unreadCount = payload.filter(n => !n.is_read).length;
      })
      // ── markNotificationReadThunk ──
      .addCase(markNotificationReadThunk.fulfilled, (state, { payload }) => {
        const notif = state.userNotifications.find(n => n.id === payload.notificationId);
        if (notif) {
          notif.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { clearDetail, resetNotifications, addNotificationRealtime, setUnreadCount } = rescueRequestsSlice.actions;
export default rescueRequestsSlice.reducer;