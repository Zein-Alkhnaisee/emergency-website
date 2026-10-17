import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

// ── Thunks ──

/** جلب حالة التوفر الحالية */
export const fetchMyAvailability = createAsyncThunk(
    'emergencyAvailability/fetch',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await emergencyApi.getMyAvailability(token);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

/** تبديل حالة التوفر (تفعيل/تعطيل) */
export const toggleAvailability = createAsyncThunk(
    'emergencyAvailability/toggle',
    async (newStatus, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await emergencyApi.updateMyAvailability(token, newStatus);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// ── Slice ──

const initialState = {
    available_for_emergency: true,
    will_receive_emergency_alerts: true,
    has_active_emergency: false,
    active_role: 'NONE',
    active_emergency_id: null,
    can_join_other_emergencies: true,
    loading: false,
    error: null,
};

const emergencyAvailabilitySlice = createSlice({
    name: 'emergencyAvailability',
    initialState,
    reducers: {
        clearAvailabilityError: (state) => { state.error = null; },
        resetAvailability: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            // ── fetchMyAvailability ──
            .addCase(fetchMyAvailability.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyAvailability.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.available_for_emergency = payload.available_for_emergency ?? true;
                state.will_receive_emergency_alerts = payload.will_receive_emergency_alerts ?? true;
                state.has_active_emergency = payload.has_active_emergency ?? false;
                state.active_role = payload.active_role ?? 'NONE';
                state.active_emergency_id = payload.active_emergency_id ?? null;
                state.can_join_other_emergencies = payload.can_join_other_emergencies ?? true;
            })
            .addCase(fetchMyAvailability.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })
            // ── toggleAvailability ──
            .addCase(toggleAvailability.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(toggleAvailability.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.available_for_emergency = payload.available_for_emergency ?? true;
                state.will_receive_emergency_alerts = payload.will_receive_emergency_alerts ?? true;
                state.has_active_emergency = payload.has_active_emergency ?? false;
                state.active_role = payload.active_role ?? 'NONE';
                state.active_emergency_id = payload.active_emergency_id ?? null;
                state.can_join_other_emergencies = payload.can_join_other_emergencies ?? true;
            })
            .addCase(toggleAvailability.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            });
    },
});

export const { clearAvailabilityError, resetAvailability } = emergencyAvailabilitySlice.actions;
export default emergencyAvailabilitySlice.reducer;