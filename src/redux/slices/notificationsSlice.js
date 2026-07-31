// src/redux/slices/notificationsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

// جلب جميع الإشعارات (طوارئ + خدمات + تقييمات)
export const fetchAllNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            // 1. إشعارات الطوارئ
            const emergencyRes = await emergencyApi.getMyNotifications(token, 50);
            const emergencyNotifs = emergencyRes.data || [];

            // 2. إشعارات المستخدم العامة (خدمات، تقييمات، إلخ)
            const userRes = await emergencyApi.getUserNotifications(token);
            const userNotifs = userRes.data || [];

            // دمج وترتيب حسب التاريخ (الأحدث أولاً)
            const all = [...emergencyNotifs, ...userNotifs];
            all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return all;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const markAllNotificationsRead = createAsyncThunk(
    'notifications/markAllRead',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            await emergencyApi.markAllNotificationsRead(token);
            return true;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const initialState = {
    list: [],
    loading: false,
    error: null,
    unreadCount: 0,
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        clearNotifications: (state) => {
            state.list = [];
            state.unreadCount = 0;
        },
        addNotification: (state, action) => {
            state.list.unshift(action.payload);
            state.unreadCount += 1;
        },
        markRead: (state, action) => {
            const notif = state.list.find(n => n.id === action.payload);
            if (notif) {
                notif.read_at = new Date().toISOString();
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllNotifications.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.list = payload;
                state.unreadCount = payload.filter(n => !n.read_at).length;
            })
            .addCase(fetchAllNotifications.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
                state.list = [];
            })
            .addCase(markAllNotificationsRead.fulfilled, (state) => {
                state.list.forEach(n => { n.read_at = new Date().toISOString(); });
                state.unreadCount = 0;
            });
    },
});

export const { clearNotifications, addNotification, markRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;