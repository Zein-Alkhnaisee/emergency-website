import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaStar, FaUserCircle, FaToolbox } from 'react-icons/fa';
import { fetchHomeGroupMembers } from '../redux/slices/emergencyChatSlice';
import { fetchUserServices } from '../redux/slices/servicesSlice';
import { fetchMyGroup } from '../redux/slices/emergencyGroupsSlice';
import Heading from '../components/Shared/Heading';
import { formatRelativeTime } from '../utils/dateHelpers';
import RateUserModal from '../components/Ratings/RateUserModal';
import { formatDate } from '../utils/dateHelpers';
import { showError } from '../utils/toastHelpers';
import LoadingSpinner from '../components/Shared/LoadingSpinner';

const GroupMembersPage = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const members = useSelector(s => s.emergencyChat.membersByContext?.home) || [];
    const userServicesMap = useSelector(s => s.services.userServices) || {};
    const { currentUser, roles, isAuthenticated } = useSelector(s => s.user);
    const currentGroup = useSelector(s => s.emergencyGroups.currentGroup);
    const groupLoading = useSelector(s => s.emergencyGroups.loading);
    
    const groupId = currentGroup?.group_id || currentGroup?.groupId || null;
    const isTrusted = roles?.includes('trusted') || currentUser?.role === 'trusted';

    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState('');
    const [showRateModal, setShowRateModal] = useState(false);
    const [showServicesFor, setShowServicesFor] = useState(null);
    const [loadingServices, setLoadingServices] = useState(false);

    // ✅ جلب المجموعة الحالية إذا لم تكن موجودة
    useEffect(() => {
        if (isAuthenticated && !groupId && !groupLoading) {
            dispatch(fetchMyGroup());
        }
    }, [dispatch, isAuthenticated, groupId, groupLoading]);

    useEffect(() => {
        if (members.length === 0 && isAuthenticated) {
            dispatch(fetchHomeGroupMembers());
        }
    }, [dispatch, members, isAuthenticated]);

    const getMemberId = (member) => {
        return member?.id || member?.user_id || member?.userId || null;
    };

    const handleViewServices = async (userId) => {
        if (!userId) {
            showError(t('services.invalidUser'));
            return;
        }
        if (userServicesMap[userId]) {
            setShowServicesFor(userId);
            return;
        }
        setLoadingServices(true);
        try {
            await dispatch(fetchUserServices(userId)).unwrap();
            setShowServicesFor(userId);
        } catch (err) {
            showError(err || t('services.errorFetchingServices'));
        }
        setLoadingServices(false);
    };

    const closeServices = () => setShowServicesFor(null);

    const handleRateClick = useCallback((userId, userName) => {
        if (!groupId) {
            showError(t('ratings.noGroup'));
            return;
        }
        setSelectedUserId(userId);
        setSelectedUserName(userName);
        setShowRateModal(true);
    }, [groupId]);

    const validMembers = members.filter(member => getMemberId(member) !== null);

    // ✅ حالة التحميل
    if (groupLoading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <Heading title={t('emergency.groupMembers')} subtitle={t('emergency.membersList')} />
                    <button
                        onClick={() => navigate('/emergency')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
                    >
                        <FaArrowRight /> {t('common.back')}
                    </button>
                </div>
                <div className="flex justify-center py-20">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    // ✅ إذا لم تكن هناك مجموعة
    if (!groupId && isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <Heading title={t('emergency.groupMembers')} subtitle={t('emergency.membersList')} />
                    <button
                        onClick={() => navigate('/emergency')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
                    >
                        <FaArrowRight /> {t('common.back')}
                    </button>
                </div>
                <div className="text-center py-20 text-gray-400">
                    {t('emergency.noGroupYet')}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <Heading title={t('emergency.groupMembers')} subtitle={t('emergency.membersList')} />
                <button
                    onClick={() => navigate('/emergency')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
                >
                    <FaArrowRight /> {t('common.back')}
                </button>
            </div>

            {validMembers.length === 0 ? (
                <div className="text-center py-20 text-gray-400 animate-fade-up">
                    {members.length > 0 ? t('emergency.noValidMembers') : t('emergency.noMembers')}
                </div>
            ) : (
                <div className="space-y-3">
                    {validMembers.map((member) => {
                        const userId = getMemberId(member);
                        const isOnline = member.is_online ?? false;
                        const lastSeen = member.last_seen_at ? formatRelativeTime(member.last_seen_at) : t('emergency.unavailable');
                        const displayName = member.name || member.display_name || t('emergency.unknown');
                        const canRate = isTrusted && currentUser?.id && userId && userId !== currentUser.id && groupId;

                        return (
                            <div
                                key={userId}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-3">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20" />
                                    ) : (
                                        <FaUserCircle className="text-3xl text-gray-400" />
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{displayName}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            {isOnline ? (
                                                <span className="text-green-500 font-medium">{t('emergency.onlineNow')}</span>
                                            ) : (
                                                <span>{lastSeen}</span>
                                            )}
                                            {member.roles?.includes('rescuer') && (
                                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-[10px]">
                                                    {t('emergency.rescuerBadge')}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {canRate && (
                                        <button
                                            onClick={() => handleRateClick(userId, displayName)}
                                            className="text-yellow-500 hover:text-yellow-600 text-sm flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-all duration-200 hover:scale-105"
                                        >
                                            <FaStar /> {t('ratings.rate')}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleViewServices(userId)}
                                        className="text-primary hover:text-primary/70 text-sm flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all duration-200 hover:scale-105"
                                    >
                                        <FaToolbox /> {t('services.viewServices')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* مودال عرض الخدمات */}
            {showServicesFor && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={closeServices}>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl border border-white/10 dark:border-gray-700/50 animate-slide-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {t('services.servicesOf')} {validMembers.find(m => getMemberId(m) === showServicesFor)?.name || ''}
                            </h3>
                            <button onClick={closeServices} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition text-xl">✕</button>
                        </div>
                        {loadingServices ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {userServicesMap[showServicesFor]?.length > 0 ? (
                                    userServicesMap[showServicesFor].map(service => (
                                        <div key={service.id} className="p-3 border rounded-xl bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700">
                                            <h4 className="font-semibold text-gray-800 dark:text-white">{service.name}</h4>
                                            <p className="text-sm text-gray-500">{service.city}</p>
                                            {service.contact_phone && <p className="text-sm">📞 {service.contact_phone}</p>}
                                            {service.created_at && <p className="text-xs text-gray-400">{formatDate(service.created_at)}</p>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-4">{t('services.noServicesFound')}</p>
                                )}
                            </div>
                        )}
                        <button
                            onClick={closeServices}
                            className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ مودال التقييم - يظهر فقط إذا كان هناك groupId */}
            {showRateModal && selectedUserId && groupId && (
                <RateUserModal
                    isOpen={showRateModal}
                    onClose={() => { setShowRateModal(false); setSelectedUserId(null); setSelectedUserName(''); }}
                    userId={selectedUserId}
                    userName={selectedUserName}
                    groupId={Number(groupId)}
                />
            )}
        </div>
    );
};

export default GroupMembersPage;