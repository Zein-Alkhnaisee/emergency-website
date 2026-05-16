import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    groups: [],           // الغروبات الرسمية { id, center: [lat,lng], members: [], groupAdminId, createdAt }
    waitingList: [],      // قائمة الانتظار { id, centroid, users: [{userId, location}], createdAt }
    userGroupMap: {},     // تعيين userId -> groupId (أو 'waiting')
    loading: false,
};

const geoGroupsSlice = createSlice({
    name: 'geoGroups',
    initialState,
    reducers: {
        setGroups: (state, action) => { state.groups = action.payload; },
        addGroup: (state, action) => { state.groups.push(action.payload); },
        addToWaitingList: (state, action) => {
            const { waitingRecord } = action.payload;
            state.waitingList.push(waitingRecord);
        },
        removeFromWaitingList: (state, action) => {
            state.waitingList = state.waitingList.filter(w => w.id !== action.payload.id);
        },
        updateWaitingList: (state, action) => { state.waitingList = action.payload; },
        setUserGroupMap: (state, action) => { state.userGroupMap = action.payload; },
        setLoading: (state, action) => { state.loading = action.payload; },
    },
});

export const { setGroups, addGroup, addToWaitingList, removeFromWaitingList, updateWaitingList, setUserGroupMap, setLoading } = geoGroupsSlice.actions;
export default geoGroupsSlice.reducer;