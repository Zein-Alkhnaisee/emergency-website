import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

export const fetchMyNotifications = createAsyncThunk(
  'emergencyNotifications/fetch',
  async ({ perPage = 15 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyNotifications(token, perPage);
      return response; // { data: [], meta }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const respondToNotification = createAsyncThunk(
  'emergencyNotifications/respond',
  async ({ notifId, response }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const res = await emergencyApi.respondToNotification(token, notifId, response);
      return { notifId, response, data: res.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  list: [],          // ✅ تأكد من أن list مصفوفة
  meta: { current_page: 1, last_page: 1, total: 0 },
  loading: false,
  error: null,
};

const emergencyNotificationsSlice = createSlice({
  name: 'emergencyNotifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.list = [];
      state.meta = { current_page: 1, last_page: 1, total: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyNotifications.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload.data || [];   // ✅ تأكد من تعيين مصفوفة
        state.meta = payload.meta || { current_page: 1, last_page: 1, total: 0 };
      })
      .addCase(fetchMyNotifications.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.list = [];   // ✅ في حالة الخطأ، تأكد من أن list مصفوفة
      })
      .addCase(respondToNotification.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(n => n.id === payload.notifId);
        if (idx !== -1) {
          state.list[idx].is_responded = true;
          state.list[idx].response = payload.response;
        }

      });
  },
});

export const { clearNotifications } = emergencyNotificationsSlice.actions;
export default emergencyNotificationsSlice.reducer;