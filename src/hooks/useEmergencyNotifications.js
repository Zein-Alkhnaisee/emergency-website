import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addEmergency, updateEmergency, addNotification } from '../redux/slices/emergencySlice';
import { distanceInKm } from '../services/geoutils';

// توليد ID فريد
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 6);

export const useEmergencyNotifications = () => {
    const dispatch = useDispatch();
    const { groups, userGroupMap } = useSelector(state => state.geoGroups);
    const { currentUser } = useSelector(state => state.user);
    const timeoutsRef = useRef({}); // لتخزين timeouts المهلة

    /**
     * إرسال حالة طوارئ جديدة
     * @param {Object} emergencyData - { type, severity, message, location }
     * @returns {string} emergencyId
     */
    const sendEmergency = useCallback(async (emergencyData) => {
        const emergencyId = generateId();
        const userId = currentUser?.id || 'user_123';
        const userGroupId = userGroupMap[userId];

        // البحث عن الغروب الذي ينتمي إليه المستخدم
        const userGroup = groups.find(g => g.id === userGroupId);

        if (!userGroup) {
            console.error('المستخدم ليس في أي غروب');
            alert('لا يمكن إرسال SOS: أنت لست في أي غروب حالياً');
            return null;
        }

        // جلب المنقذين في الغروب (يفضل المنقذين أولاً)
        const members = userGroup.members || [];
        const rescuers = members.filter(m => m.role === 'rescuer' && m.isAvailable !== false);
        const regularUsers = members.filter(m => m.role !== 'rescuer' && m.isAvailable !== false);

        // ترتيب المستلمين: المنقذين أولاً ثم المستخدمين العاديين
        let recipients = [...rescuers, ...regularUsers];

        // تحديد عدد المستلمين حسب درجة الخطورة
        let requiredCount = 0;
        switch (emergencyData.severity) {
            case 'mild': requiredCount = 5; break;
            case 'moderate': requiredCount = 20; break;
            case 'severe': requiredCount = recipients.length; break;
            default: requiredCount = recipients.length;
        }

        recipients = recipients.slice(0, requiredCount);

        // إنشاء سجل حالة الطوارئ
        const newEmergency = {
            id: emergencyId,
            userId: userId,
            groupId: userGroup.id,
            type: emergencyData.type,
            severity: emergencyData.severity,
            message: emergencyData.message || '',
            location: emergencyData.location,
            status: 'active',
            recipients: recipients.map(r => ({
                userId: r.id,
                status: 'pending', // pending, accepted, rejected, timeout
                respondedAt: null,
            })),
            acceptedCount: 0,
            requiredCount,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 دقيقة صلاحية
        };

        dispatch(addEmergency(newEmergency));

        // إرسال إشعارات لكل مستلم
        for (const recipient of recipients) {
            dispatch(addNotification({
                id: generateId(),
                userId: recipient.id,
                emergencyId,
                type: 'SOS',
                title: `🚨 حالة طوارئ ${emergencyData.type === 'fire' ? 'حريق' : emergencyData.type === 'accident' ? 'حادث' : 'طبية'} في منطقتك!`,
                message: emergencyData.message || 'يحتاج شخص للمساعدة',
                severity: emergencyData.severity,
                location: emergencyData.location,
                status: 'pending',
                createdAt: new Date().toISOString(),
                read: false,
            }));
        }

        // بدء مهلة 5 دقائق للاستجابة
        startResponseTimeout(emergencyId, recipients, userGroup);

        return emergencyId;
    }, [currentUser, groups, userGroupMap, dispatch]);

    /**
     * بدء مهلة انتظار الردود
     */
    const startResponseTimeout = useCallback((emergencyId, recipients, userGroup) => {
        const timeoutId = setTimeout(async () => {
            // جلب حالة الطوارئ الحالية
            const emergency = useSelector(state => state.emergency.activeEmergencies.find(e => e.id === emergencyId));
            if (!emergency || emergency.status !== 'active') return;
            const pendingRecipients = emergency.recipients.filter(r => r.status === 'pending');

            if (emergency.acceptedCount < emergency.requiredCount && pendingRecipients.length > 0) {
                console.log(`⚠️ لم يستجب ${pendingRecipients.length} منقذ، يتم البحث عن غروب مجاور...`);

                // البحث عن أقرب غروب مجاور
                const nearestGroup = findNearestGroupOutside(emergency.location, userGroup.id, groups);

                if (nearestGroup) {
                    // جلب أعضاء الغروب المجاور
                    const nearbyMembers = nearestGroup.members || [];
                    const nearbyRecipients = nearbyMembers
                        .filter(m => m.isAvailable !== false)
                        .slice(0, emergency.requiredCount - emergency.acceptedCount);

                    // إرسال إشعارات للأعضاء الجدد
                    for (const recipient of nearbyRecipients) {
                        dispatch(addNotification({
                            id: generateId(),
                            userId: recipient.id,
                            emergencyId,
                            type: 'SOS_RELAY',
                            title: `🚨 حالة طوارئ (تم توجيهها من غروب مجاور)`,
                            message: emergency.message || 'يحتاج شخص للمساعدة في منطقة قريبة',
                            severity: emergency.severity,
                            location: emergency.location,
                            status: 'pending',
                            createdAt: new Date().toISOString(),
                            read: false,
                        }));
                    }
                } else {
                    // انتهاء المهلة ولم يستجب أحد
                    dispatch(updateEmergency({ id: emergencyId, updates: { status: 'expired' } }));
                }
            }
        }, 5 * 60 * 1000); // 5 دقائق

        timeoutsRef.current[emergencyId] = timeoutId;
    }, [dispatch, groups]);

    /**
     * البحث عن أقرب غروب مجاور (ليس الغروب الحالي)
     */
    const findNearestGroupOutside = useCallback((location, currentGroupId, allGroups) => {
        let nearest = null;
        let minDistance = Infinity;

        for (const group of allGroups) {
            if (group.id === currentGroupId) continue;
            const dist = distanceInKm(location, group.center);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = group;
            }
        }
        return nearest;
    }, []);

    /**
     * قبول المشاركة في حالة طوارئ
     */
    const acceptEmergency = useCallback(async (emergencyId, userId) => {
        const emergency = useSelector(state => state.emergency.activeEmergencies.find(e => e.id === emergencyId));
        if (!emergency) return false;

        // تحديث حالة المستلم
        const updatedRecipients = emergency.recipients.map(r =>
            r.userId === userId ? { ...r, status: 'accepted', respondedAt: new Date().toISOString() } : r
        );

        const newAcceptedCount = updatedRecipients.filter(r => r.status === 'accepted').length;

        dispatch(updateEmergency({
            id: emergencyId,
            updates: {
                recipients: updatedRecipients,
                acceptedCount: newAcceptedCount,
                status: newAcceptedCount >= emergency.requiredCount ? 'resolved' : 'active'
            }
        }));

        // تحديث الإشعار للمستخدم
        dispatch(addNotification({
            id: generateId(),
            userId,
            emergencyId,
            type: 'RESPONSE',
            title: '✅ تم قبول المشاركة',
            message: 'تم إبلاغ مبلغ الحالة بمشاركتك. يرجى التوجه للموقع',
            status: 'accepted',
            createdAt: new Date().toISOString(),
            read: false,
        }));

        return true;
    }, [dispatch]);

    /**
     * رفض المشاركة في حالة طوارئ
     */
    const rejectEmergency = useCallback(async (emergencyId, userId) => {
        const emergency = useSelector(state => state.emergency.activeEmergencies.find(e => e.id === emergencyId));
        if (!emergency) return false;

        const updatedRecipients = emergency.recipients.map(r =>
            r.userId === userId ? { ...r, status: 'rejected', respondedAt: new Date().toISOString() } : r
        );

        dispatch(updateEmergency({ id: emergencyId, updates: { recipients: updatedRecipients } }));
        // إرسال إشعار بطلب بديل (تلقائياً)
        const pendingRecipients = updatedRecipients.filter(r => r.status === 'pending');
        if (pendingRecipients.length > 0 && emergency.acceptedCount < emergency.requiredCount) {
            // إعادة توجيه الطلب لمستخدم آخر
            const nextRecipient = pendingRecipients[0];
            dispatch(addNotification({
                id: generateId(),
                userId: nextRecipient.userId,
                emergencyId,
                type: 'SOS_RELAY',
                title: ` 🚨 حالة طوارئ (تم تحويلها إليك)`,
                message: emergency.message || 'يحتاج شخص للمساعدة',
                severity: emergency.severity,
                location: emergency.location,
                status: 'pending',
                createdAt: new Date().toISOString(),
                read: false,
            }));
        }

        return true;
    }, [dispatch]);

    return {
        sendEmergency,
        acceptEmergency,
        rejectEmergency,
    };
};