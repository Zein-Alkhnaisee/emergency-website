import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    roles: [], // ['user', 'rescuer', 'groupAdmin', 'sectionManager', 'superAdmin']
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        loginStart: (state) => { state.loading = true; state.error = null; },
        loginSuccess: (state, action) => {
            state.currentUser = action.payload.user;
            state.roles = action.payload.roles;
            state.isAuthenticated = true;
            state.loading = false;
        },
        loginFailure: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        logout: (state) => {
            state.currentUser = null;
            state.roles = [];
            state.isAuthenticated = false;
        },
        updateUser: (state, action) => {
            state.currentUser = { ...state.currentUser, ...action.payload };
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } = userSlice.actions;
export default userSlice.reducer;