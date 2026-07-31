import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import emergencyReducer from './slices/emergencySlice';
import geoGroupsReducer from './slices/geoGroupsSlice';
import postsReducer from './slices/postsSlice';
import coursesReducer from './slices/coursesSlice';
import marketplaceReducer from './slices/marketplaceSlice';
import servicesReducer from './slices/servicesSlice';
import roleRequestsReducer from './slices/roleRequestsSlice';
import emergencyGroupsReducer from './slices/emergencyGroupsSlice';
import profileReducer from './slices/profileSlice';
import emergencySosReducer from './slices/emergencySosSlice';
import emergencyNotificationsReducer from './slices/emergencyNotificationsSlice';
import emergencyCasesReducer from './slices/emergencyCasesSlice';
import emergencyChatReducer from './slices/emergencyChatSlice';
import trustReducer from './slices/trustSlice';
import ratingsReducer from './slices/ratingsSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    emergency: emergencyReducer,
    geoGroups: geoGroupsReducer,
    posts: postsReducer,
    courses: coursesReducer,
    marketplace: marketplaceReducer,
    services: servicesReducer,
    roleRequests: roleRequestsReducer,
    emergencyGroups: emergencyGroupsReducer,
    profile: profileReducer,
    emergencySos: emergencySosReducer,
    emergencyNotifications: emergencyNotificationsReducer,
    emergencyCases: emergencyCasesReducer,
    emergencyChat: emergencyChatReducer,
    trust: trustReducer,
    ratings: ratingsReducer,
    notifications: notificationsReducer,
  },
});