import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';


export const sendSOS = createAsyncThunk(
    'emergencySos/send',
    async ({ case_type, custom_text, severity, location_lat, location_lng }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await emergencyApi.sendSOS(token, case_type, custom_text, severity, location_lat, location_lng);
            return response.data; // { emergency_id, group, chat_context, ... }
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const retryMyCase = createAsyncThunk(
    'emergencySos/retry',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await emergencyApi.retryMyCase(token);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const initialState = {
    currentEmergency: null,
    loading: false,
    error: null,
    retrying: false,
};

const emergencySosSlice = createSlice({
    name: 'emergencySos',
    initialState,
    reducers: {
        clearCurrentEmergency: (state) => { state.currentEmergency = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendSOS.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(sendSOS.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.currentEmergency = payload;
            })
            .addCase(sendSOS.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })
            .addCase(retryMyCase.pending, (state) => { state.retrying = true; })
            .addCase(retryMyCase.fulfilled, (state, { payload }) => {
                state.retrying = false;
                state.currentEmergency = payload;
            })
            .addCase(retryMyCase.rejected, (state, { payload }) => {
                state.retrying = false;
                state.error = payload;
            });
    },
});

export const { clearCurrentEmergency } = emergencySosSlice.actions;
export default emergencySosSlice.reducer;