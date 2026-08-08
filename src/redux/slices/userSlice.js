import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';

const safeParse = (item, defaultValue = null) => {
  if (!item || item === 'undefined' || item === 'null') return defaultValue;
  try { return JSON.parse(item); }
  catch { return defaultValue; }
};

export const loginUser = createAsyncThunk('user/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authApi.login(credentials);
    const { token, user, roles } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user ?? null));
    // ✅ FIX: نخزن roles دايماً كمصفوفة
    localStorage.setItem('roles', JSON.stringify(Array.isArray(roles) ? roles : (roles ? [roles] : [])));
    return { user, roles: Array.isArray(roles) ? roles : (roles ? [roles] : []), token };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const registerUser = createAsyncThunk('user/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await authApi.register(userData);
    return { temp_token: data.temp_token };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const logoutUser = createAsyncThunk('user/logout', async (_, { getState, rejectWithValue }) => {
  try {
    const token = getState().user.currentUser?.token || localStorage.getItem('token');
    if (token && token !== 'undefined') await authApi.logout(token);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    return true;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    return rejectWithValue(error.message);
  }
});

export const forgotPasswordThunk = createAsyncThunk('user/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const data = await authApi.forgotPassword(email);
    return { temp_token: data.temp_token };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const verifyOTPThunk = createAsyncThunk('user/verifyOTP', async ({ temp_token, otp_code }, { rejectWithValue }) => {
  try {
    const data = await authApi.verifyOTP(temp_token, otp_code);
    return { temp_token: data.temp_token };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const resetPasswordThunk = createAsyncThunk('user/resetPassword', async ({ temp_token, password, password_confirmation }, { rejectWithValue }) => {
  try {
    const data = await authApi.resetPassword(temp_token, password, password_confirmation);
    const { token, user, roles } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user ?? null));
    localStorage.setItem('roles', JSON.stringify(Array.isArray(roles) ? roles : (roles ? [roles] : [])));
    return { user, roles: Array.isArray(roles) ? roles : (roles ? [roles] : []), token };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const resendOTPThunk = createAsyncThunk('user/resendOTP', async (temp_token, { rejectWithValue }) => {
  try {
    const data = await authApi.resendOTP(temp_token);
    return { temp_token: data.temp_token };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const verifyEmailThunk = createAsyncThunk('user/verifyEmail', async ({ temp_token, verification_code }, { rejectWithValue }) => {
  try {
    const data = await authApi.verifyEmailCode(temp_token, verification_code);
    const { token, user, roles } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user ?? null));
    localStorage.setItem('roles', JSON.stringify(Array.isArray(roles) ? roles : (roles ? [roles] : [])));
    return { user, roles: Array.isArray(roles) ? roles : (roles ? [roles] : []), token };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// ✅ FIX: ثاندك جديد لجلب /auth/me وتحديث roles بعد reload
// استدعيه في App.jsx أو Layout عند mount إذا في token
export const fetchMe = createAsyncThunk('user/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined') throw new Error('No token');
    const data = await authApi.getMe(token);
    // data = { user, roles, permissions }
    const roles = Array.isArray(data.roles) ? data.roles : (data.roles ? [data.roles] : []);
    localStorage.setItem('user', JSON.stringify(data.user ?? null));
    localStorage.setItem('roles', JSON.stringify(roles));
    return { user: data.user, roles };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// ─────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────

const storedRoles = safeParse(localStorage.getItem('roles'), []);

const initialState = {
  currentUser: safeParse(localStorage.getItem('user')),
  isAuthenticated: !!localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined',
  // ✅ FIX: نضمن roles دايماً مصفوفة
  roles: Array.isArray(storedRoles) ? storedRoles : (storedRoles ? [storedRoles] : []),
  loading: false,
  error: null,
  temp_token: null,
};

// ─────────────────────────────────────────
// مساعد داخلي لمعالجة roles بشكل موحد
// ─────────────────────────────────────────
const normalizeRoles = (roles) =>
  Array.isArray(roles) ? roles : (roles ? [roles] : []);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.currentUser));
    },
    clearTempToken: (state) => { state.temp_token = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // ── login ───────────────────────────────────────
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentUser = payload.user;
        state.roles = normalizeRoles(payload.roles); // ✅
      })
      .addCase(loginUser.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })

      // ── register ────────────────────────────────────
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, { payload }) => { state.loading = false; state.temp_token = payload.temp_token; })
      .addCase(registerUser.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })

      // ── logout ──────────────────────────────────────
      .addCase(logoutUser.fulfilled, (state) => {
        state.currentUser = null;
        state.roles = [];
        state.isAuthenticated = false;
        state.temp_token = null;
      })

      // ── fetchMe (GET /auth/me) ──────────────────────
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.currentUser = payload.user;
        state.roles = normalizeRoles(payload.roles); // ✅ يحدّث roles بعد reload
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        // لو فشل الـ me (token منتهي مثلاً) — نسجّل خروج ناعم
        state.currentUser = null;
        state.roles = [];
        state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('roles');
      })

      // ── forgotPassword ──────────────────────────────
      .addCase(forgotPasswordThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(forgotPasswordThunk.fulfilled, (state, { payload }) => { state.loading = false; state.temp_token = payload.temp_token; })
      .addCase(forgotPasswordThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })

      // ── verifyOTP ───────────────────────────────────
      .addCase(verifyOTPThunk.pending, (state) => { state.loading = true; })
      .addCase(verifyOTPThunk.fulfilled, (state, { payload }) => { state.loading = false; state.temp_token = payload.temp_token; })
      .addCase(verifyOTPThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })

      // ── resetPassword ───────────────────────────────
      .addCase(resetPasswordThunk.pending, (state) => { state.loading = true; })
      .addCase(resetPasswordThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentUser = payload.user;
        state.roles = normalizeRoles(payload.roles); // ✅
        state.temp_token = null;
      })
      .addCase(resetPasswordThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })

      // ── resendOTP ───────────────────────────────────
      .addCase(resendOTPThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOTPThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        // ✅ نحتفظ بـ temp_token القديم إذا لم يعد الخادم واحداً جديداً
        if (payload?.temp_token) {
          state.temp_token = payload.temp_token;
        }
        // إذا لم يعد الخادم رمزاً، نترك state.temp_token كما هو (لا نغيره)
        state.error = null;
      })
      .addCase(resendOTPThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // ── verifyEmail ─────────────────────────────────
      .addCase(verifyEmailThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyEmailThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentUser = payload.user;
        state.roles = normalizeRoles(payload.roles); // ✅
        state.temp_token = null;
      })
      .addCase(verifyEmailThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
  },
});

export const { updateUser, clearTempToken, clearError } = userSlice.actions;
export default userSlice.reducer;
