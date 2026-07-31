// src/redux/slices/servicesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as servicesApi from '../../services/servicesApi';

// ─── Services ────────────────────────────────────────────────────
export const fetchCategories = createAsyncThunk(
  'services/fetchCategories',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.listCategories(token);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCities = createAsyncThunk(
  'services/fetchCities',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.listCities(token);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchHomeServices = createAsyncThunk(
  'services/fetchHome',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.getHomeGroupServices(token);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchNearbyServices = createAsyncThunk(
  'services/fetchNearby',
  async ({ latitude, longitude }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.getNearbyServices(token, latitude, longitude);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchServicesByCity = createAsyncThunk(
  'services/fetchByCity',
  async (city, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.getServicesByCity(token, city);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const submitService = createAsyncThunk(
  'services/submit',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.submitService(token, formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyServices = createAsyncThunk(
  'services/fetchMy',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.getMyServices(token);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateService = createAsyncThunk(
  'services/update',
  async ({ serviceId, formData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.updateService(token, serviceId, formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteService = createAsyncThunk(
  'services/delete',
  async (serviceId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await servicesApi.deleteService?.(token, serviceId);
      return serviceId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Bookings ────────────────────────────────────────────────────

export const bookService = createAsyncThunk(
  'services/book',
  async ({ serviceId, bookingData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.bookService(token, serviceId, bookingData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'services/fetchMyBookings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.getMyBookings(token);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchReceivedBookings = createAsyncThunk(
  'services/fetchReceived',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.getReceivedBookings(token);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const approveBooking = createAsyncThunk(
  'services/approveBooking',
  async (bookingId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.approveBooking(token, bookingId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rejectBooking = createAsyncThunk(
  'services/rejectBooking',
  async ({ bookingId, reason }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.rejectBooking(token, bookingId, reason);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const completeBooking = createAsyncThunk(
  'services/completeBooking',
  async (bookingId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.completeBooking(token, bookingId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'services/cancelBooking',
  async (bookingId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.cancelBooking(token, bookingId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Ratings ─────────────────────────────────────────────────────

export const rateService = createAsyncThunk(
  'services/rate',
  async ({ serviceId, groupId, score, review_text }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.rateService(token, serviceId, groupId, score, review_text);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateServiceRating = createAsyncThunk(
  'services/updateRating',
  async ({ serviceId, ratingId, score, review_text }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.updateServiceRating(token, serviceId, ratingId, score, review_text);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteServiceRating = createAsyncThunk(
  'services/deleteRating',
  async ({ serviceId, ratingId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await servicesApi.deleteServiceRating(token, serviceId, ratingId);
      return ratingId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchServiceRatings = createAsyncThunk(
  'services/fetchRatings',
  async ({ serviceId, groupId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.getServiceRatings(token, serviceId, groupId);
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchServiceRatingStats = createAsyncThunk(
  'services/fetchRatingStats',
  async ({ serviceId, groupId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await servicesApi.getServiceRatingStats(token, serviceId, groupId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Report ─────────────────────────────────────────────────────
export const reportProvider = createAsyncThunk(
  'services/reportProvider',
  async ({ id }, { getState, rejectWithValue }) => {
    try {
      return { id, reported: true };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────

const initialState = {
  services: [],
  nearbyServices: [], // ✅ إضافة للخدمات القريبة
  myServices: [],
  categories: [],
  cities: [],
  myBookings: [],
  receivedBookings: [],
  loading: false,
  submitting: false,
  error: null,
  filterCity: 'الكل',
  filterCategory: 'الكل',
  reportAlert: null,
};

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setFilterCity: (state, action) => { state.filterCity = action.payload; },
    setFilterCategory: (state, action) => { state.filterCategory = action.payload; },
    clearServicesError: (state) => { state.error = null; },
    setLoading: (state, action) => { state.loading = action.payload; },
    clearReportAlert: (state) => { state.reportAlert = null; },
    removeProvider: (state, action) => {
      state.services = state.services.filter(s => s.id !== action.payload);
    },
    clearNearbyServices: (state) => {
      state.nearbyServices = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchHomeServices ──
      .addCase(fetchHomeServices.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHomeServices.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.services = Array.isArray(payload) ? payload : [];
      })
      .addCase(fetchHomeServices.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.services = [];
      })

      // ── fetchNearbyServices ──
      .addCase(fetchNearbyServices.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNearbyServices.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.nearbyServices = Array.isArray(payload) ? payload : [];
      })
      .addCase(fetchNearbyServices.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.nearbyServices = [];
      })

      // ── fetchCategories ──
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.categories = Array.isArray(payload) ? payload : [];
      })

      // ── fetchCities ──
      .addCase(fetchCities.fulfilled, (state, { payload }) => {
        state.cities = Array.isArray(payload) ? payload : [];
      })

      // ── fetchMyServices ──
      .addCase(fetchMyServices.fulfilled, (state, { payload }) => {
        state.myServices = Array.isArray(payload) ? payload : [];
      })

      // ── submitService ──
      .addCase(submitService.fulfilled, (state, { payload }) => {
        state.myServices.unshift(payload);
        if (payload.status === 'approved') {
          state.services.unshift(payload);
        }
      })

      // ── updateService ──
      .addCase(updateService.fulfilled, (state, { payload }) => {
        const idx = state.myServices.findIndex(s => s.id === payload.id);
        if (idx !== -1) state.myServices[idx] = payload;
        const idx2 = state.services.findIndex(s => s.id === payload.id);
        if (idx2 !== -1) state.services[idx2] = payload;
      })

      // ── deleteService ──
      .addCase(deleteService.fulfilled, (state, { payload }) => {
        state.myServices = state.myServices.filter(s => s.id !== payload);
        state.services = state.services.filter(s => s.id !== payload);
      })

      // ── fetchMyBookings ──
      .addCase(fetchMyBookings.fulfilled, (state, { payload }) => {
        state.myBookings = Array.isArray(payload) ? payload : [];
      })

      // ── fetchReceivedBookings ──
      .addCase(fetchReceivedBookings.fulfilled, (state, { payload }) => {
        state.receivedBookings = Array.isArray(payload) ? payload : [];
      })

      // ── approveBooking ──
      .addCase(approveBooking.fulfilled, (state, { payload }) => {
        const idx = state.receivedBookings.findIndex(b => b.id === payload.id);
        if (idx !== -1) state.receivedBookings[idx] = payload;
        const myIdx = state.myBookings.findIndex(b => b.id === payload.id);
        if (myIdx !== -1) state.myBookings[myIdx] = payload;
      })

      // ── rejectBooking ──
      .addCase(rejectBooking.fulfilled, (state, { payload }) => {
        const idx = state.receivedBookings.findIndex(b => b.id === payload.id);
        if (idx !== -1) state.receivedBookings[idx] = payload;
        const myIdx = state.myBookings.findIndex(b => b.id === payload.id);
        if (myIdx !== -1) state.myBookings[myIdx] = payload;
      })

      // ── completeBooking ──
      .addCase(completeBooking.fulfilled, (state, { payload }) => {
        const idx = state.receivedBookings.findIndex(b => b.id === payload.id);
        if (idx !== -1) state.receivedBookings[idx] = payload;
        const myIdx = state.myBookings.findIndex(b => b.id === payload.id);
        if (myIdx !== -1) state.myBookings[myIdx] = payload;
      })

      // ── cancelBooking ──
      .addCase(cancelBooking.fulfilled, (state, { payload }) => {
        const myIdx = state.myBookings.findIndex(b => b.id === payload.id);
        if (myIdx !== -1) state.myBookings[myIdx] = payload;
      });
  },
});

export const {
  setFilterCity,
  setFilterCategory,
  clearServicesError,
  setLoading,
  clearReportAlert,
  removeProvider,
  clearNearbyServices,
} = servicesSlice.actions;

export default servicesSlice.reducer;