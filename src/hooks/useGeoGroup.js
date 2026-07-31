import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { findNearestGroup, isWithinRadius, GROUP_RADIUS_KM, calculateCentroid } from '../services/geoutils';
import { addToWaitingList, setUserGroupMap, updateWaitingList } from '../redux/slices/geoGroupsSlice';

export const useGeoGroup = (userLocation, userId) => {
    const dispatch = useDispatch();
    const { groups, waitingList, userGroupMap } = useSelector(state => state.geoGroups);
    const [assignedGroupId, setAssignedGroupId] = useState(null);
    const [isInWaiting, setIsInWaiting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userLocation || !userId) return;
        setLoading(true);
        if (userGroupMap[userId]) {
            const mapped = userGroupMap[userId];
            if (mapped === 'waiting') {
                setIsInWaiting(true);
                setAssignedGroupId(null);
            } else {
                setAssignedGroupId(mapped);
                setIsInWaiting(false);
            }
            setLoading(false);
            return;
        }
        const nearest = findNearestGroup(userLocation, groups);
        if (nearest) {
            dispatch(setUserGroupMap({ ...userGroupMap, [userId]: nearest.group.id }));
            setAssignedGroupId(nearest.group.id);
            setIsInWaiting(false);
            setLoading(false);
            return;
        }
        let foundWaiting = null;
        for (let w of waitingList) {
            if (isWithinRadius(userLocation, w.centroid, GROUP_RADIUS_KM)) {
                foundWaiting = w;
                break;
            }
        }
        if (foundWaiting) {
            const updatedUsers = [...foundWaiting.users, { userId, location: userLocation }];
            const newCentroid = calculateCentroid(updatedUsers.map(u => u.location));
            const updatedWaiting = { ...foundWaiting, centroid: newCentroid, users: updatedUsers, count: updatedUsers.length };
            const newWaitingList = waitingList.map(w => w.id === foundWaiting.id ? updatedWaiting : w);
            dispatch(updateWaitingList(newWaitingList));
            dispatch(setUserGroupMap({ ...userGroupMap, [userId]: 'waiting' }));
            setIsInWaiting(true);
        } else {
            const newWaitingRecord = {
                id: Date.now().toString(),
                centroid: userLocation,
                users: [{ userId, location: userLocation }],
                count: 1,
                createdAt: new Date().toISOString(),
            };
            dispatch(addToWaitingList({ waitingRecord: newWaitingRecord }));
            dispatch(setUserGroupMap({ ...userGroupMap, [userId]: 'waiting' }));
            setIsInWaiting(true);
        }
        setLoading(false);
    }, [userLocation, userId, groups, waitingList, dispatch, userGroupMap]);

    return { assignedGroupId, isInWaiting, loading };
};