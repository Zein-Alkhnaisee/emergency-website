import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import emergencyReducer from './slices/emergencySlice';
import geoGroupsReducer from './slices/geoGroupsSlice';
import postsReducer from './slices/postsSlice';
import coursesReducer from './slices/coursesSlice';
import marketplaceReducer from './slices/marketplaceSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        emergency: emergencyReducer,
        geoGroups: geoGroupsReducer,
        posts: postsReducer,
        courses: coursesReducer,
        marketplace: marketplaceReducer,
    },
});