import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

export const submitRoleRequest = createAsyncThunk(
  'roleRequests/submit',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.submitRoleRequest(token, formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyRoleRequests = createAsyncThunk(
  'roleRequests/fetchMy',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyRoleRequests(token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  requests: [],
  loading: false,
  error: null,
  submitting: false,
};

const roleRequestsSlice = createSlice({
  name: 'roleRequests',
  initialState,
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRoleRequests.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyRoleRequests.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.requests = payload;
      })
      .addCase(fetchMyRoleRequests.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(submitRoleRequest.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(submitRoleRequest.fulfilled, (state, { payload }) => {
        state.submitting = false;
        state.requests.unshift(payload);
      })
      .addCase(submitRoleRequest.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      });
  },
});

export const { clearError } = roleRequestsSlice.actions;
export default roleRequestsSlice.reducer;