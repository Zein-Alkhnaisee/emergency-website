import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

// ─── Thunks ──────────────────────────────────────────────────────

/** جلب تقييمات مستخدم معين في غروب */
// ─── في `ratingsSlice.js`، تأكد من وجود هذا الـ thunk ───
export const fetchUserRatings = createAsyncThunk(
  'ratings/fetchUserRatings',
  async ({ userId, groupId, page = 1, perPage = 15 }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getUserRatings(token, userId, groupId, page, perPage);
      return response.data; // { data: [], meta: {} }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** جلب تقييماتي (التي أرسلتها أنا) */
export const fetchMyGivenRatings = createAsyncThunk(
  'ratings/fetchMyGiven',
  async ({ groupId = null, page = 1, perPage = 15 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyGivenRatings(token, groupId, page, perPage);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** جلب إحصاءات تقييمي في غروب */
export const fetchMyRatingStats = createAsyncThunk(
  'ratings/fetchMyStats',
  async (groupId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getMyRatingStats(token, groupId);
      // ✅ الـ response يحتوي على { data: { ... } }
      // نعيد response.data مباشرة
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** إنشاء تقييم جديد */
export const createRating = createAsyncThunk(
  'ratings/create',
  async ({ groupId, ratedId, score }, { getState, rejectWithValue }) => {
    try {
      if (!ratedId) throw new Error('معرف المستخدم المطلوب تقييمه غير صالح');
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.createRating(token, groupId, ratedId, score);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** تعديل تقييم */
export const updateRating = createAsyncThunk(
  'ratings/update',
  async ({ ratingId, score }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.updateRating(token, ratingId, score);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** حذف تقييم */
export const deleteRating = createAsyncThunk(
  'ratings/delete',
  async (ratingId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await emergencyApi.deleteRating(token, ratingId);
      return ratingId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** تفعيل/إيقاف السماح بالتقييم */
export const toggleRatable = createAsyncThunk(
  'ratings/toggleRatable',
  async (isRatable, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.toggleRatable(token, isRatable);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────

const initialState = {
  userRatings: { data: [], meta: {} },
  myGivenRatings: { data: [], meta: {} },
  myStats: null,  // ✅ سيحتوي على { user, group, total, average, max_score, average_percent, qualifies_admin }
  loading: false,
  error: null,
  submitting: false,
};

const ratingsSlice = createSlice({
  name: 'ratings',
  initialState,
  reducers: {
    clearRatingsError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchUserRatings ──
      .addCase(fetchUserRatings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUserRatings.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.userRatings = payload || { data: [], meta: {} };
      })
      .addCase(fetchUserRatings.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // ── fetchMyGivenRatings ──
      .addCase(fetchMyGivenRatings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyGivenRatings.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.myGivenRatings = payload || { data: [], meta: {} };
      })
      .addCase(fetchMyGivenRatings.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // ── fetchMyRatingStats ──
      .addCase(fetchMyRatingStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyRatingStats.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.myStats = payload;  // ✅ payload هو { user, group, total, average, ... }
      })
      .addCase(fetchMyRatingStats.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.myStats = null;
      })

      // ── createRating ──
      .addCase(createRating.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createRating.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(createRating.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      })

      // ── updateRating ──
      .addCase(updateRating.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(updateRating.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(updateRating.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      })

      // ── deleteRating ──
      .addCase(deleteRating.pending, (state) => { state.submitting = true; })
      .addCase(deleteRating.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(deleteRating.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      })

      // ── toggleRatable ──
      .addCase(toggleRatable.fulfilled, (state, { payload }) => {
        // تحديث is_ratable داخل myStats إن وجد
        if (state.myStats?.user) {
          state.myStats.user.is_ratable = payload.is_ratable;
        }
      });
  },
});

export const { clearRatingsError } = ratingsSlice.actions;
export default ratingsSlice.reducer;