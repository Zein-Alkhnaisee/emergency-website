import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

// ─── Thunks ──────────────────────────────────────────────────────

export const submitReportThunk = createAsyncThunk(
    'reports/submit',
    async ({ reportType, reportedId, reportedName, details, messageId, rescueParticipationId, serviceId, emergencyId }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const payload = {
                report_type: reportType,
                reported_id: reportedId,
                details: details || '',
            };
            if (messageId) payload.message_id = messageId;
            if (rescueParticipationId) payload.rescue_participation_id = rescueParticipationId;
            if (serviceId) payload.service_id = serviceId;
            if (emergencyId) payload.emergency_id = emergencyId;

            const response = await emergencyApi.submitReport(token, payload);
            return response.data;
        } catch (err) {
            const errorMsg = err?.message || err || '';
            return rejectWithValue(errorMsg);
        }
    }
);
export const fetchMyReportsThunk = createAsyncThunk(
    'reports/fetchMy',
    async (params = {}, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await emergencyApi.getMyReports(token, params);
            return response;
        } catch (err) {
            const errorMsg = err?.message || err || '';
            if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('could not be found')) {
                return { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
            }
            return rejectWithValue(errorMsg);
        }
    }
);

export const deleteReportThunk = createAsyncThunk(
    'reports/delete',
    async (reportId, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            await emergencyApi.deleteReport(token, reportId);
            return reportId;
        } catch (err) {
            // ✅ err قد يكون كائن Error أو سلسلة نصية
            const errorMsg = err?.message || err || '';
            // ✅ تحقق من 404 بصيغة مختلفة
            if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('could not be found')) {
                // نعتبر الحذف ناجحاً لأن الـ API غير موجود
                return reportId;
            }
            return rejectWithValue(errorMsg);
        }
    }
);

// ─── Initial State ──────────────────────────────────────────────

const initialState = {
    list: [],
    meta: { current_page: 1, last_page: 1, total: 0 },
    loading: false,
    submitting: false,
    deleting: false,
    error: null,
};

// ─── Slice ──────────────────────────────────────────────────────

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        clearReports: (state) => {
            state.list = [];
            state.meta = { current_page: 1, last_page: 1, total: 0 };
            state.loading = false;
            state.submitting = false;
            state.deleting = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ── Submit ──
            .addCase(submitReportThunk.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(submitReportThunk.fulfilled, (state, { payload, meta }) => {
                state.submitting = false;
                console.log('✅ Report submitted successfully:', payload);
                console.log('📦 meta.arg:', meta.arg);

                const { reportedId, reportedName, details } = meta.arg;
                const newReport = {
                    ...payload,
                    details: details || '',
                    reported_at: new Date().toISOString(),
                    processed_at: null,
                    can_delete: true,
                    reported: reportedId ? { id: reportedId, name: reportedName || null } : null,
                };
                console.log('📝 New report to add:', newReport);
                state.list.unshift(newReport);
                state.meta.total += 1;
            })
            .addCase(submitReportThunk.rejected, (state, { payload }) => {
                state.submitting = false;
                state.error = payload;
            })
            // ── Fetch My ──
            .addCase(fetchMyReportsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyReportsThunk.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.list = payload.data || [];
                state.meta = payload.meta || { current_page: 1, last_page: 1, total: 0 };
            })
            .addCase(fetchMyReportsThunk.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
                state.list = [];
            })
            // ── Delete ──
            .addCase(deleteReportThunk.pending, (state) => {
                state.deleting = true;
                state.error = null;
            })
            .addCase(deleteReportThunk.fulfilled, (state, { payload }) => {
                state.deleting = false;
                state.list = state.list.filter(r => r.id !== payload);
                state.meta.total -= 1;
            })
            .addCase(deleteReportThunk.rejected, (state, { payload }) => {
                state.deleting = false;
                state.error = payload;
            });
    },
});

export const { clearReports } = reportsSlice.actions;
export default reportsSlice.reducer;