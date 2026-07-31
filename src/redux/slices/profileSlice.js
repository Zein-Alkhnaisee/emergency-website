// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import * as profileApi from '../../services/profileApi';

// export const fetchMyProfile = createAsyncThunk(
//     'profile/fetch',
//     async (_, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await profileApi.getMyProfile(token);
//             return response.data;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const createProfile = createAsyncThunk(
//     'profile/create',
//     async ({ profileData, avatarFile }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await profileApi.createProfile(token, profileData, avatarFile);
//             return response.data;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const updateProfile = createAsyncThunk(
//     'profile/update',
//     async ({ updates, avatarFile }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await profileApi.updateProfile(token, updates, avatarFile);
//             return response.data;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const deleteProfile = createAsyncThunk(
//     'profile/delete',
//     async (_, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             await profileApi.deleteProfile(token);
//             return true;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const fetchMyLocation = createAsyncThunk(
//     'profile/fetchLocation',
//     async (_, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await profileApi.getMyLocation(token);
//             return response.data;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const addLocation = createAsyncThunk(
//     'profile/addLocation',
//     async ({ latitude, longitude, country, state, city }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await profileApi.addLocation(token, latitude, longitude, country, state, city);
//             return response.data;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const updateLocation = createAsyncThunk(
//     'profile/updateLocation',
//     async (updates, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await profileApi.updateLocation(token, updates);
//             return response.data;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const deleteLocation = createAsyncThunk(
//     'profile/deleteLocation',
//     async (_, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             await profileApi.deleteLocation(token);
//             return true;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const updateLocationVisibility = createAsyncThunk(
//     'profile/updateVisibility',
//     async (isPublic, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await profileApi.updateLocationVisibility(token, isPublic);
//             return response.data;
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// const initialState = {
//     data: null,
//     location: null,
//     loading: false,
//     error: null,
// };

// const profileSlice = createSlice({
//     name: 'profile',
//     initialState,
//     reducers: {
//         clearProfile: (state) => {
//             state.data = null;
//             state.location = null;
//             state.error = null;
//         },
//     },
//     extraReducers: (builder) => {
//         builder
//             .addCase(fetchMyProfile.pending, (state) => { state.loading = true; state.error = null; })
//             .addCase(fetchMyProfile.fulfilled, (state, { payload }) => {
//                 state.loading = false;
//                 state.data = payload;
//             })
//             .addCase(fetchMyProfile.rejected, (state, { payload }) => {
//                 state.loading = false;
//                 state.error = payload;
//             })
//             .addCase(createProfile.fulfilled, (state, { payload }) => {
//                 state.data = payload;
//             })
//             .addCase(updateProfile.fulfilled, (state, { payload }) => {
//                 state.data = payload;
//             })
//             .addCase(deleteProfile.fulfilled, (state) => {
//                 state.data = null;
//             })
//             .addCase(fetchMyLocation.fulfilled, (state, { payload }) => {
//                 state.location = payload;
//             })
//             .addCase(addLocation.fulfilled, (state, { payload }) => {
//                 state.location = payload;
//             })
//             .addCase(updateLocation.fulfilled, (state, { payload }) => {
//                 state.location = payload;
//             })
//             .addCase(deleteLocation.fulfilled, (state) => {
//                 state.location = null;
//             })
//             .addCase(updateLocationVisibility.fulfilled, (state, { payload }) => {
//                 state.location = payload;
//             });
//     },
// });

// export const { clearProfile } = profileSlice.actions;
// export default profileSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as profileApi from '../../services/profileApi';

export const fetchMyProfile = createAsyncThunk(
    'profile/fetch',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await profileApi.getMyProfile(token);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const createProfile = createAsyncThunk(
    'profile/create',
    async ({ profileData, avatarFile }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await profileApi.createProfile(token, profileData, avatarFile);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateProfile = createAsyncThunk(
    'profile/update',
    async ({ updates, avatarFile }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await profileApi.updateProfile(token, updates, avatarFile);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const deleteProfile = createAsyncThunk(
    'profile/delete',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            await profileApi.deleteProfile(token);
            return true;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchMyLocation = createAsyncThunk(
    'profile/fetchLocation',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await profileApi.getMyLocation(token);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const addLocation = createAsyncThunk(
    'profile/addLocation',
    async ({ latitude, longitude, country, state, city }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await profileApi.addLocation(token, latitude, longitude, country, state, city);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateLocation = createAsyncThunk(
    'profile/updateLocation',
    async (updates, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await profileApi.updateLocation(token, updates);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const deleteLocation = createAsyncThunk(
    'profile/deleteLocation',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            await profileApi.deleteLocation(token);
            return true;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateLocationVisibility = createAsyncThunk(
    'profile/updateVisibility',
    async (isPublic, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.currentUser?.token || localStorage.getItem('token');
            const response = await profileApi.updateLocationVisibility(token, isPublic);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const initialState = {
    data: null,
    location: null,
    loading: false,
    error: null,
};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        clearProfile: (state) => {
            state.data = null;
            state.location = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyProfile.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchMyProfile.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.data = payload;
            })
            .addCase(fetchMyProfile.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })
            .addCase(createProfile.fulfilled, (state, { payload }) => {
                state.data = payload;
            })
            .addCase(updateProfile.fulfilled, (state, { payload }) => {
                state.data = payload;
            })
            .addCase(deleteProfile.fulfilled, (state) => {
                state.data = null;
            })
            .addCase(fetchMyLocation.fulfilled, (state, { payload }) => {
                state.location = payload;
            })
            .addCase(addLocation.fulfilled, (state, { payload }) => {
                state.location = payload;
            })
            .addCase(updateLocation.fulfilled, (state, { payload }) => {
                state.location = payload;
            })
            .addCase(deleteLocation.fulfilled, (state) => {
                state.location = null;
            })
            .addCase(updateLocationVisibility.fulfilled, (state, { payload }) => {
                state.location = payload;
            });
    },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;