import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeEmergencies: [], // حالات الطوارئ النشطة
  notifications: [],     // إشعارات المستخدم الحالي
  loading: false,
};

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    // إضافة حالة طوارئ جديدة
    addEmergency: (state, action) => {
      state.activeEmergencies.push(action.payload);
    },
    // تحديث حالة طوارئ (مقبولة، مرفوضة، منتهية)
    updateEmergency: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.activeEmergencies.findIndex(e => e.id === id);
      if (index !== -1) {
        state.activeEmergencies[index] = { ...state.activeEmergencies[index], ...updates };
      }
    },
    // إضافة إشعار للمستخدم
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload); // الأحدث أولاً
    },
    // تحديث حالة إشعار (تم القراءة)
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) notification.read = true;
    },
    // حذف إشعار
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { 
  addEmergency, 
  updateEmergency, 
  addNotification, 
  markNotificationRead, 
  clearNotifications, 
  setLoading 
} = emergencySlice.actions;
export default emergencySlice.reducer;