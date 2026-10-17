// // src/redux/slices/trackingSlice.js
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import * as trackingApi from '../../services/trackingApi';
// import { v4 as uuidv4 } from 'uuid';

// // ─── Thunks ──────────────────────────────────────────────

// export const acceptRescueWithTracking = createAsyncThunk(
//     'tracking/acceptRescue',
//     async ({ emergencyId, originData }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const body = {};
//             if (originData) {
//                 body.origin = {
//                     latitude: originData.latitude,
//                     longitude: originData.longitude,
//                     accuracy_m: originData.accuracy_m || 10,
//                     recorded_at: originData.recorded_at || new Date().toISOString(),
//                 };
//             }
//             const response = await trackingApi.acceptRescueWithOrigin(emergencyId, body, token);
//             return response;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const recordOriginThunk = createAsyncThunk(
//     'tracking/recordOrigin',
//     async ({ emergencyId, originData }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await trackingApi.recordOrigin(emergencyId, originData, token);
//             return response.data;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const sendPingThunk = createAsyncThunk(
//     'tracking/sendPing',
//     async ({ emergencyId, pingData }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await trackingApi.sendPing(emergencyId, pingData, token);
//             return response.data;
//         } catch (err) {
//             if (err.status === 429 || err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
//                 // ✅ لا نرمي خطأ، نعيد قيمة خاصة
//                 return { rate_limited: true };
//             }
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const fetchTrackingSnapshot = createAsyncThunk(
//     'tracking/fetchSnapshot',
//     async (emergencyId, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await trackingApi.getTrackingSnapshot(emergencyId, token);
//             return response.data;
//         } catch (err) {
//             if (err.status === 403) {
//                 return { rescuers: [], trackingActive: false, emergency: null };
//             }
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const fetchRescuerTrail = createAsyncThunk(
//     'tracking/fetchTrail',
//     async ({ emergencyId, userId, limit = 500 }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await trackingApi.getRescuerTrail(emergencyId, userId, token, limit);
//             return { userId, points: response.data.points, meta: response.data.meta };
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// // ─── Initial State ──────────────────────────────────────

// const initialState = {
//     emergency: null,
//     trackingActive: false,
//     rescuers: [],
//     trails: {},
//     myParticipation: null,
//     myOrigin: null,
//     myCurrentPing: null,
//     myTrackingStatus: null,
//     loading: false,
//     error: null,
//     submitting: false,
//     clientPingId: null,
// };

// // ─── Slice ──────────────────────────────────────────────

// const trackingSlice = createSlice({
//     name: 'tracking',
//     initialState,
//     reducers: {
//         updateRescuerLocation: (state, action) => {
//             const { user_id, latitude, longitude, accuracy_m, heading, speed_mps, is_origin, recorded_at, server_received_at } = action.payload;
//             const rescuer = state.rescuers.find(r => r.user_id === user_id);
//             if (rescuer) {
//                 if (is_origin) {
//                     rescuer.origin = { latitude, longitude, accuracy_m, recorded_at, server_received_at };
//                     rescuer.tracking_status = 'live';
//                 } else {
//                     rescuer.current = { latitude, longitude, accuracy_m, heading, speed_mps, recorded_at, server_received_at };
//                     rescuer.last_ping_age_seconds = 0;
//                     rescuer.is_stale = false;
//                     rescuer.tracking_status = 'live';
//                 }
//             } else {
//                 state.rescuers.push({
//                     user_id,
//                     name: `منقذ #${user_id}`,
//                     tracking_status: 'live',
//                     origin: is_origin ? { latitude, longitude, accuracy_m, recorded_at, server_received_at } : null,
//                     current: is_origin ? null : { latitude, longitude, accuracy_m, heading, speed_mps, recorded_at, server_received_at },
//                     last_ping_age_seconds: 0,
//                     is_stale: false,
//                     participation: null,
//                 });
//             }
//         },
//         markRescuerStale: (state, action) => {
//             const { user_id } = action.payload;
//             const rescuer = state.rescuers.find(r => r.user_id === user_id);
//             if (rescuer) {
//                 rescuer.is_stale = true;
//                 rescuer.tracking_status = 'stale';
//             }
//         },
//         addTrailPoint: (state, action) => {
//             const { user_id, point } = action.payload;
//             if (!state.trails[user_id]) {
//                 state.trails[user_id] = [];
//             }
//             const last = state.trails[user_id][state.trails[user_id].length - 1];
//             if (last && last.recorded_at === point.recorded_at) return;
//             state.trails[user_id].push(point);
//         },
//         clearTracking: () => initialState,
//         setClientPingId: (state, action) => {
//             state.clientPingId = action.payload || uuidv4();
//         },
//         setMyOrigin: (state, action) => {
//             state.myOrigin = action.payload;
//             if (action.payload) {
//                 state.myTrackingStatus = 'live';
//             }
//         },
//         setMyCurrentPing: (state, action) => {
//             state.myCurrentPing = action.payload;
//         },
//         setParticipationResolved: (state) => {
//             if (state.myParticipation) {
//                 state.myParticipation.is_resolved_by_user = true;
//                 state.myParticipation.resolved_at = new Date().toISOString();
//                 state.myTrackingStatus = 'finished';
//             }
//             state.trackingActive = false;
//         },
//     },
//     extraReducers: (builder) => {
//         builder
//             .addCase(acceptRescueWithTracking.pending, (state) => {
//                 state.submitting = true;
//                 state.error = null;
//             })
//             .addCase(acceptRescueWithTracking.fulfilled, (state, { payload }) => {
//                 state.submitting = false;
//                 if (payload.data) {
//                     state.emergency = payload.data;
//                 }
//                 if (payload.tracking) {
//                     state.trackingActive = payload.tracking.origin_recorded;
//                     if (payload.tracking.origin) {
//                         state.myOrigin = payload.tracking.origin;
//                         state.myTrackingStatus = 'live';
//                     } else {
//                         state.myTrackingStatus = 'no_origin';
//                     }
//                 }
//                 if (payload.data?.participation) {
//                     state.myParticipation = payload.data.participation;
//                 }
//                 state.clientPingId = uuidv4();
//             })
//             .addCase(acceptRescueWithTracking.rejected, (state, { payload }) => {
//                 state.submitting = false;
//                 state.error = payload;
//             })
//             .addCase(recordOriginThunk.pending, (state) => {
//                 state.submitting = true;
//                 state.error = null;
//             })
//             .addCase(recordOriginThunk.fulfilled, (state, { payload }) => {
//                 state.submitting = false;
//                 state.myOrigin = payload;
//                 state.myTrackingStatus = 'live';
//                 state.trackingActive = true;
//             })
//             .addCase(recordOriginThunk.rejected, (state, { payload }) => {
//                 state.submitting = false;
//                 state.error = payload;
//             })
//             .addCase(sendPingThunk.fulfilled, (state, { payload }) => {
//                 // ✅ معالجة 429
//                 if (payload.rate_limited) {
//                     return;
//                 }
//                 if (!payload.deduplicated) {
//                     state.myCurrentPing = payload;
//                     const me = state.rescuers.find(r => r.user_id === payload.user_id);
//                     if (me) {
//                         if (payload.is_origin) {
//                             me.origin = { latitude: payload.latitude, longitude: payload.longitude, accuracy_m: payload.accuracy_m, recorded_at: payload.recorded_at, server_received_at: payload.server_received_at };
//                         } else {
//                             me.current = { latitude: payload.latitude, longitude: payload.longitude, accuracy_m: payload.accuracy_m, heading: payload.heading, speed_mps: payload.speed_mps, recorded_at: payload.recorded_at, server_received_at: payload.server_received_at };
//                         }
//                         me.tracking_status = 'live';
//                         me.is_stale = false;
//                         me.last_ping_age_seconds = 0;
//                     }
//                 }
//             })
//             .addCase(sendPingThunk.rejected, (state, { payload }) => {
//                 if (payload === 'ORIGIN_REQUIRED' || payload?.includes('ORIGIN_REQUIRED')) {
//                     state.myTrackingStatus = 'no_origin';
//                 } else {
//                     state.error = payload;
//                 }
//             })
//             .addCase(fetchTrackingSnapshot.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(fetchTrackingSnapshot.fulfilled, (state, { payload }) => {
//                 state.loading = false;
//                 state.emergency = payload.emergency;
//                 state.trackingActive = payload.tracking_active;
//                 state.rescuers = payload.rescuers || [];
//                 const me = state.rescuers.find(r => r.user_id === payload.my_user_id);
//                 if (me) {
//                     state.myParticipation = me.participation;
//                     state.myOrigin = me.origin;
//                     state.myCurrentPing = me.current;
//                     state.myTrackingStatus = me.tracking_status;
//                 }
//             })
//             .addCase(fetchTrackingSnapshot.rejected, (state, { payload }) => {
//                 state.loading = false;
//                 state.error = payload;
//             })
//             .addCase(fetchRescuerTrail.fulfilled, (state, { payload }) => {
//                 state.trails[payload.userId] = payload.points;
//             });
//     },
// });

// export const {
//     updateRescuerLocation,
//     markRescuerStale,
//     addTrailPoint,
//     clearTracking,
//     setClientPingId,
//     setMyOrigin,
//     setMyCurrentPing,
//     setParticipationResolved,
// } = trackingSlice.actions;

// export default trackingSlice.reducer;

// src/redux/slices/trackingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as trackingApi from '../../services/trackingApi';
import { v4 as uuidv4 } from 'uuid';

// ─── Thunks ──────────────────────────────────────────────


export const acceptRescueWithTracking = createAsyncThunk(
    'tracking/acceptRescue',
    async ({ emergencyId, originData }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const body = {};
            if (originData) {
                body.origin = {
                    latitude: originData.latitude,
                    longitude: originData.longitude,
                    accuracy_m: originData.accuracy_m || 10,
                    recorded_at: originData.recorded_at || new Date().toISOString(),
                };
            }
            const response = await trackingApi.acceptRescueWithOrigin(emergencyId, body, token);
            return response;
        } catch (err) {
            // ✅ تمرير error_code إذا كان موجوداً
            return rejectWithValue(err.data?.error_code || err.message);
        }
    }
);

export const recordOriginThunk = createAsyncThunk(
    'tracking/recordOrigin',
    async ({ emergencyId, originData }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await trackingApi.recordOrigin(emergencyId, originData, token);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const sendPingThunk = createAsyncThunk(
    'tracking/sendPing',
    async ({ emergencyId, pingData }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await trackingApi.sendPing(emergencyId, pingData, token);
            return response.data;
        } catch (err) {
            if (err.status === 429 || err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
                return { rate_limited: true };
            }
            // ✅ تمرير error_code
            return rejectWithValue(err.data?.error_code || err.message);
        }
    }
);

export const fetchTrackingSnapshot = createAsyncThunk(
    'tracking/fetchSnapshot',
    async (emergencyId, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await trackingApi.getTrackingSnapshot(emergencyId, token);
            return response.data;
        } catch (err) {
            if (err.status === 403) {
                return { rescuers: [], trackingActive: false, emergency: null };
            }
            return rejectWithValue(err.message);
        }
    }
);

export const fetchRescuerTrail = createAsyncThunk(
    'tracking/fetchTrail',
    async ({ emergencyId, userId, limit = 500 }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await trackingApi.getRescuerTrail(emergencyId, userId, token, limit);
            return { userId, points: response.data.points, meta: response.data.meta };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// ─── Initial State ──────────────────────────────────────

const initialState = {
    emergency: null,
    trackingActive: false,
    rescuers: [],
    trails: {},
    myParticipation: null,
    myOrigin: null,
    myCurrentPing: null,
    myTrackingStatus: null,
    loading: false,
    error: null,
    submitting: false,
    clientPingId: null,
};

// ─── Slice ──────────────────────────────────────────────

const trackingSlice = createSlice({
    name: 'tracking',
    initialState,
    reducers: {
        updateRescuerLocation: (state, action) => {
            const { user_id, latitude, longitude, accuracy_m, heading, speed_mps, is_origin, recorded_at, server_received_at } = action.payload;
            const rescuer = state.rescuers.find(r => r.user_id === user_id);
            if (rescuer) {
                if (is_origin) {
                    rescuer.origin = { latitude, longitude, accuracy_m, recorded_at, server_received_at };
                    rescuer.tracking_status = 'live';
                } else {
                    rescuer.current = { latitude, longitude, accuracy_m, heading, speed_mps, recorded_at, server_received_at };
                    rescuer.last_ping_age_seconds = 0;
                    rescuer.is_stale = false;
                    rescuer.tracking_status = 'live';
                }
            } else {
                state.rescuers.push({
                    user_id,
                    name: `منقذ #${user_id}`,
                    tracking_status: 'live',
                    origin: is_origin ? { latitude, longitude, accuracy_m, recorded_at, server_received_at } : null,
                    current: is_origin ? null : { latitude, longitude, accuracy_m, heading, speed_mps, recorded_at, server_received_at },
                    last_ping_age_seconds: 0,
                    is_stale: false,
                    participation: null,
                });
            }
        },
        markRescuerStale: (state, action) => {
            const { user_id } = action.payload;
            const rescuer = state.rescuers.find(r => r.user_id === user_id);
            if (rescuer) {
                rescuer.is_stale = true;
                rescuer.tracking_status = 'stale';
            }
        },
        addTrailPoint: (state, action) => {
            const { user_id, point } = action.payload;
            if (!state.trails[user_id]) {
                state.trails[user_id] = [];
            }
            const last = state.trails[user_id][state.trails[user_id].length - 1];
            if (last && last.recorded_at === point.recorded_at) return;
            state.trails[user_id].push(point);
        },
        clearTracking: () => initialState,
        setClientPingId: (state, action) => {
            state.clientPingId = action.payload || uuidv4();
        },
        setMyOrigin: (state, action) => {
            state.myOrigin = action.payload;
            if (action.payload) {
                state.myTrackingStatus = 'live';
            }
        },
        setMyCurrentPing: (state, action) => {
            state.myCurrentPing = action.payload;
        },
        setParticipationResolved: (state) => {
            if (state.myParticipation) {
                state.myParticipation.is_resolved_by_user = true;
                state.myParticipation.resolved_at = new Date().toISOString();
                state.myTrackingStatus = 'finished';
            }
            state.trackingActive = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(acceptRescueWithTracking.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(acceptRescueWithTracking.fulfilled, (state, { payload }) => {
                state.submitting = false;
                if (payload.data) {
                    state.emergency = payload.data;
                }
                if (payload.tracking) {
                    state.trackingActive = payload.tracking.origin_recorded;
                    if (payload.tracking.origin) {
                        state.myOrigin = payload.tracking.origin;
                        state.myTrackingStatus = 'live';
                    } else {
                        state.myTrackingStatus = 'no_origin';
                    }
                }
                if (payload.data?.participation) {
                    state.myParticipation = payload.data.participation;
                }
                state.clientPingId = uuidv4();
            })
            .addCase(acceptRescueWithTracking.rejected, (state, { payload }) => {
                state.submitting = false;
                state.error = payload;
            })
            .addCase(recordOriginThunk.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(recordOriginThunk.fulfilled, (state, { payload }) => {
                state.submitting = false;
                state.myOrigin = payload;
                state.myTrackingStatus = 'live';
                state.trackingActive = true;
            })
            .addCase(recordOriginThunk.rejected, (state, { payload }) => {
                state.submitting = false;
                state.error = payload;
            })
            .addCase(sendPingThunk.fulfilled, (state, { payload }) => {
                // ✅ معالجة 429
                if (payload.rate_limited) {
                    return;
                }
                if (!payload.deduplicated) {
                    state.myCurrentPing = payload;
                    const me = state.rescuers.find(r => r.user_id === payload.user_id);
                    if (me) {
                        if (payload.is_origin) {
                            me.origin = { latitude: payload.latitude, longitude: payload.longitude, accuracy_m: payload.accuracy_m, recorded_at: payload.recorded_at, server_received_at: payload.server_received_at };
                        } else {
                            me.current = { latitude: payload.latitude, longitude: payload.longitude, accuracy_m: payload.accuracy_m, heading: payload.heading, speed_mps: payload.speed_mps, recorded_at: payload.recorded_at, server_received_at: payload.server_received_at };
                        }
                        me.tracking_status = 'live';
                        me.is_stale = false;
                        me.last_ping_age_seconds = 0;
                    }
                }
            })
            .addCase(sendPingThunk.rejected, (state, { payload }) => {
                if (payload === 'ORIGIN_REQUIRED' || payload?.includes('ORIGIN_REQUIRED')) {
                    state.myTrackingStatus = 'no_origin';
                } else {
                    state.error = payload;
                }
            })
            .addCase(fetchTrackingSnapshot.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTrackingSnapshot.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.emergency = payload.emergency;
                state.trackingActive = payload.tracking_active;
                state.rescuers = payload.rescuers || [];
                const me = state.rescuers.find(r => r.user_id === payload.my_user_id);
                if (me) {
                    state.myParticipation = me.participation;
                    state.myOrigin = me.origin;
                    state.myCurrentPing = me.current;
                    state.myTrackingStatus = me.tracking_status;
                }
            })
            .addCase(fetchTrackingSnapshot.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })
            .addCase(fetchRescuerTrail.fulfilled, (state, { payload }) => {
                state.trails[payload.userId] = payload.points;
            });
    },
});

export const {
    updateRescuerLocation,
    markRescuerStale,
    addTrailPoint,
    clearTracking,
    setClientPingId,
    setMyOrigin,
    setMyCurrentPing,
    setParticipationResolved,
} = trackingSlice.actions;

export default trackingSlice.reducer;