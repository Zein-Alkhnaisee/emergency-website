// src/redux/slices/coursesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as coursesApi from '../../services/coursesApi';

// ─── Thunks ──────────────────────────────────────────────────────

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async ({ categoryId = null, page = 1, perPage = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await coursesApi.getCourses(categoryId, page, perPage);
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'courses/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await coursesApi.getCategories();
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCourseDetail = createAsyncThunk(
  'courses/fetchCourseDetail',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await coursesApi.getCourse(courseId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCourseRatings = createAsyncThunk(
  'courses/fetchRatings',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await coursesApi.getCourseRatings(courseId);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCourseRatingStats = createAsyncThunk(
  'courses/fetchRatingStats',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await coursesApi.getCourseRatingStats(courseId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rateCourse = createAsyncThunk(
  'courses/rateCourse',
  async ({ courseId, score, review_text = '' }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await coursesApi.rateCourse(token, courseId, score, review_text);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCourseRating = createAsyncThunk(
  'courses/updateRating',
  async ({ courseId, ratingId, score, review_text = '' }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await coursesApi.updateCourseRating(token, courseId, ratingId, score, review_text);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteCourseRating = createAsyncThunk(
  'courses/deleteRating',
  async ({ courseId, ratingId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await coursesApi.deleteCourseRating(token, courseId, ratingId);
      return ratingId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────

const initialState = {
  courses: [],
  categories: [],
  courseDetail: null,
  ratings: [],
  ratingStats: null,
  filter: 'all',
  category: 'all',
  loading: false,
  error: null,
  submitting: false,
  pagination: { currentPage: 1, lastPage: 1, total: 0 },
  // بيانات وهمية للشهادات (للمحاكاة)
  userCertificates: [],
};

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setFilter: (state, action) => { state.filter = action.payload; },
    setCategory: (state, action) => { state.category = action.payload; },
    clearError: (state) => { state.error = null; },
    clearCourseDetail: (state) => { state.courseDetail = null; },
    
    // ✅ إضافة actions قديمة للتوافق
    reportCourse: (state, action) => {
      // في الإصدار الحالي لا نستخدمه، لكن نضيفه لتفادي الأخطاء
      console.warn('reportCourse is deprecated. Use API instead.');
    },
    addCertificate: (state, action) => {
      state.userCertificates.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCourses.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.courses = payload.data || [];
        state.pagination = payload.meta || { currentPage: 1, lastPage: 1, total: 0 };
      })
      .addCase(fetchCourses.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.courses = [];
      })

      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.categories = payload;
      })
      .addCase(fetchCategories.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.categories = [];
      })

      .addCase(fetchCourseDetail.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCourseDetail.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.courseDetail = payload;
      })
      .addCase(fetchCourseDetail.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.courseDetail = null;
      })

      .addCase(fetchCourseRatings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCourseRatings.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.ratings = payload;
      })
      .addCase(fetchCourseRatings.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.ratings = [];
      })

      .addCase(fetchCourseRatingStats.fulfilled, (state, { payload }) => {
        state.ratingStats = payload;
      })

      .addCase(rateCourse.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(rateCourse.fulfilled, (state, { payload }) => {
        state.submitting = false;
        state.ratings.unshift(payload);
      })
      .addCase(rateCourse.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      })

      .addCase(updateCourseRating.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(updateCourseRating.fulfilled, (state, { payload }) => {
        state.submitting = false;
        const idx = state.ratings.findIndex(r => r.id === payload.id);
        if (idx !== -1) state.ratings[idx] = payload;
      })
      .addCase(updateCourseRating.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      })

      .addCase(deleteCourseRating.pending, (state) => { state.submitting = true; })
      .addCase(deleteCourseRating.fulfilled, (state, { payload }) => {
        state.submitting = false;
        state.ratings = state.ratings.filter(r => r.id !== payload);
      })
      .addCase(deleteCourseRating.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      });
  },
});

export const { 
  setFilter, 
  setCategory, 
  clearError, 
  clearCourseDetail,
  reportCourse,
  addCertificate,
} = coursesSlice.actions;

export default coursesSlice.reducer;