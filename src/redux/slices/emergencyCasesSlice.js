import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

export const fetchMyActiveCase = createAsyncThunk(
  'emergencyCases/fetchMy',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyActiveCase(token);
      return response.data;
    } catch (err) {
      // ✅ 404 تعني "لا توجد حالة"، نعتبرها حالة عادية وليس خطأ
      if (err.message && err.message.includes('404')) {
        return null;
      }
      return rejectWithValue(err.message);
    }
  }
);

export const resolveMyCase = createAsyncThunk(
  'emergencyCases/resolveMy',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.resolveMyCase(token);
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

const initialState = {
  myCase: null,
  detail: null,
  loading: false,
  error: null,
  resolving: false,
};

const emergencyCasesSlice = createSlice({
  name: 'emergencyCases',
  initialState,
  reducers: {
    clearMyCase: (state) => { state.myCase = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyActiveCase.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyActiveCase.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.myCase = payload;
        state.error = null;
      })
      .addCase(fetchMyActiveCase.rejected, (state, { payload }) => {
        state.loading = false;
        state.myCase = null;
        if (payload && payload.includes('404')) {
          state.error = null; // ✅ لا نعرض خطأ للمستخدم
        } else {
          state.error = payload;
        }
      })
      .addCase(resolveMyCase.pending, (state) => { state.resolving = true; })
      .addCase(resolveMyCase.fulfilled, (state, { payload }) => {
        state.resolving = false;
        state.myCase = payload;
      })
      .addCase(resolveMyCase.rejected, (state, { payload }) => {
        state.resolving = false;
        state.error = payload;
      })
      .addCase(fetchCaseDetail.fulfilled, (state, { payload }) => {
        state.detail = payload;
      })
      .addCase(resolveCase.fulfilled, (state, { payload }) => {
        state.detail = payload;
      });
  },
});

export const { clearMyCase } = emergencyCasesSlice.actions;
export default emergencyCasesSlice.reducer;