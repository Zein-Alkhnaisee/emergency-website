import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { findNearestGroup, isWithinRadius, GROUP_RADIUS_KM, calculateCentroid, clusterUsers } from '../services/geoutils';
import { addToWaitingList, setUserGroupMap, updateWaitingList } from '../redux/slices/geoGroupsSlice';

export const useGeoGroup = (userLocation, userId) => {
    const dispatch = useDispatch();
    const { groups, waitingList, userGroupMap } = useSelector(state => state.geoGroups);
    const [assignedGroupId, setAssignedGroupId] = useState(null);
    const [isInWaiting, setIsInWaiting] = useState(false);
    const [loading, setLoading] = useState(true);

    // البحث عن أقرب غروب أو التعامل مع الانتظار
    useEffect(() => {
        if (!userLocation || !userId) return;
        setLoading(true);
        // هل تم تعيينه سابقاً؟
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

        // 1. البحث عن غروب قائم ضمن النطاق
        const nearest = findNearestGroup(userLocation, groups);
        if (nearest) {
            // الانضمام إلى هذا الغروب
            dispatch(setUserGroupMap({ ...userGroupMap, [userId]: nearest.group.id }));
            setAssignedGroupId(nearest.group.id);
            setIsInWaiting(false);
            setLoading(false);
            return;
        }

        // 2. لا يوجد غروب قريب -> إضافة إلى قائمة الانتظار أو دمج مع سجل انتظار موجود
        let foundWaiting = null;
        for (let w of waitingList) {
            if (isWithinRadius(userLocation, w.centroid, GROUP_RADIUS_KM)) {
                foundWaiting = w;
                break;
            }
        }
        if (foundWaiting) {
            // إضافة المستخدم إلى سجل الانتظار الموجود
            const updatedUsers = [...foundWaiting.users, { userId, location: userLocation }];
            const newCentroid = calculateCentroid(updatedUsers.map(u => u.location));
            const updatedWaiting = {
                ...foundWaiting,
                centroid: newCentroid,
                users: updatedUsers,
                count: updatedUsers.length,
            };
            // تحديث قائمة الانتظار في Redux (يجب إرسال إجراء جديد)
            const newWaitingList = waitingList.map(w => w.id === foundWaiting.id ? updatedWaiting : w);
            dispatch(updateWaitingList(newWaitingList));
            // إذا أصبح العدد >= 3 -> إرسال طلب لمدير الطوارئ (سنضيفه لاحقاً)
            if (updatedUsers.length >= 3) {
                console.log('طلب إنشاء غروب جديد لسجل الانتظار:', updatedWaiting);
                // هنا سنستدعي action يرسل إشعاراً لمدير القسم
            }
            dispatch(setUserGroupMap({ ...userGroupMap, [userId]: 'waiting' }));
            setIsInWaiting(true);
        } else {
            // إنشاء سجل انتظار جديد
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