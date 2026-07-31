// src/redux/slices/trustSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { trustApi } from '../../services/trustApi';

// ──────────────────────────────────────────────────────
// THUNKS
// ──────────────────────────────────────────────────────

/** جلب طلب التوثيق الحالي */
export const fetchMyVerification = createAsyncThunk(
  'trust/fetchMyVerification',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.token || localStorage.getItem('token');
      const data = await trustApi.getMyVerification(token);
      return data;
    } catch (err) {
      // إذا كان 404 يعني لا يوجد طلب، نعتبره حالة طبيعية
      if (err.status === 404) {
        return { data: null };
      }
      return rejectWithValue(err.message);
    }
  }
);

/** تقديم طلب توثيق جديد */
export const submitVerification = createAsyncThunk(
  'trust/submitVerification',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.token || localStorage.getItem('token');
      const response = await trustApi.submitVerification(formData, token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** تحديث طلب (pending أو rejected) */
export const updateVerification = createAsyncThunk(
  'trust/updateVerification',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.token || localStorage.getItem('token');
      const response = await trustApi.updateVerification(formData, token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** حذف الطلب */
export const deleteVerification = createAsyncThunk(
  'trust/deleteVerification',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.token || localStorage.getItem('token');
      await trustApi.deleteVerification(token);
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** جلب الإشعارات */
export const fetchNotifications = createAsyncThunk(
  'trust/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.token || localStorage.getItem('token');
      const data = await trustApi.getNotifications(token);
      return data.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** تعيين إشعار كمقروء */
export const markNotificationRead = createAsyncThunk(
  'trust/markNotificationRead',
  async (notificationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.token || localStorage.getItem('token');
      await trustApi.markNotificationRead(notificationId, token);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ──────────────────────────────────────────────────────
// SLICE
// ──────────────────────────────────────────────────────

const initialState = {
  verification: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  notifications: [],
  notificationsLoading: false,
};

const trustSlice = createSlice({
  name: 'trust',
  initialState,
  reducers: {
    clearTrustError: (state) => { state.error = null; },
    clearVerification: (state) => { state.verification = null; state.status = 'idle'; },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchMyVerification ──
      .addCase(fetchMyVerification.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyVerification.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.verification = payload.data || null;
        state.error = null;
      })
      .addCase(fetchMyVerification.rejected, (state) => {
        // لا نضع error لأن 404 تم معالجته في الـ thunk
        state.status = 'succeeded';
        state.verification = null;
        state.error = null;
      })

      // ── submitVerification ──
      .addCase(submitVerification.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(submitVerification.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.verification = payload;
        state.error = null;
      })
      .addCase(submitVerification.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // ── updateVerification ──
      .addCase(updateVerification.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateVerification.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.verification = payload;
        state.error = null;
      })
      .addCase(updateVerification.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })

      // ── deleteVerification ──
      .addCase(deleteVerification.fulfilled, (state) => {
        state.verification = null;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(deleteVerification.rejected, (state, { payload }) => {
        state.error = payload;
      })

      // ── fetchNotifications ──
      .addCase(fetchNotifications.pending, (state) => {
        state.notificationsLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.notificationsLoading = false;
        state.notifications = payload;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.notificationsLoading = false;
      })

      // ── markNotificationRead ──
      .addCase(markNotificationRead.fulfilled, (state, { payload }) => {
        const notif = state.notifications.find(n => n.id === payload);
        if (notif) notif.read_at = new Date().toISOString();
      });
  },
});

export const { clearTrustError, clearVerification } = trustSlice.actions;
export default trustSlice.reducer;