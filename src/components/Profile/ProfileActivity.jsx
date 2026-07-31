// src/components/Profile/ProfileActivity.jsx
// 🔑 Member — عرض سجل التعليقات والتفاعلات في الملف الشخصي
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaComment, FaHeart, FaThumbsDown, FaExternalLinkAlt, FaChevronRight } from 'react-icons/fa';
import { fetchMyComments, fetchMyReactions } from '../../redux/slices/postsSlice';

const TAB = { COMMENTS: 'comments', REACTIONS: 'reactions' };

const ProfileActivity = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState(TAB.COMMENTS);

    const { myComments, myReactions } = useSelector(s => s.posts);

    useEffect(() => {
        dispatch(fetchMyComments());
        dispatch(fetchMyReactions());
    }, [dispatch]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-700">
                <TabButton
                    active={activeTab === TAB.COMMENTS}
                    onClick={() => setActiveTab(TAB.COMMENTS)}
                    icon={<FaComment />}
                    label="تعليقاتي"
                    count={myComments.meta?.total}
                />
                <TabButton
                    active={activeTab === TAB.REACTIONS}
                    onClick={() => setActiveTab(TAB.REACTIONS)}
                    icon={<FaHeart />}
                    label="تفاعلاتي"
                    count={myReactions.meta?.total}
                />
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {activeTab === TAB.COMMENTS && (
                    <CommentsList
                        loading={myComments.loading}
                        error={myComments.error}
                        data={myComments.data}
                    />
                )}
                {activeTab === TAB.REACTIONS && (
                    <ReactionsList
                        loading={myReactions.loading}
                        error={myReactions.error}
                        data={myReactions.data}
                    />
                )}
            </div>
        </div>
    );
};

// ── تعليقاتي ───────────────────────────────────────────────
const CommentsList = ({ loading, error, data }) => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState msg={error} />;
    if (!data?.length) return <EmptyState label="لم تكتب أي تعليق بعد" icon="💬" />;

    return (
        <>
            {data.map(comment => (
                <div key={comment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FaComment className="text-primary text-xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2 leading-relaxed">
                                {comment.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {comment.on && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 truncate">
                                        <FaChevronRight className="text-[9px]" />
                                        {comment.on.title}
                                    </span>
                                )}
                                <span className="text-[10px] text-gray-300 dark:text-gray-600 mr-auto">
                                    {formatDate(comment.created_at)}
                                </span>
                            </div>
                            {comment.reactions_count > 0 && (
                                <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <FaHeart className="text-rose-400 text-[10px]" />
                                    {comment.reactions_count} إعجاب
                                </span>
                            )}
                        </div>
                        {comment.on?.id && (
                            <a
                                href={`/posts/${comment.on.id}`}
                                className="text-gray-300 hover:text-primary transition-colors flex-shrink-0"
                                title="عرض المقالة"
                            >
                                <FaExternalLinkAlt className="text-xs" />
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
};

// ── تفاعلاتي ───────────────────────────────────────────────
const ReactionsList = ({ loading, error, data }) => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState msg={error} />;
    if (!data?.length) return <EmptyState label="لم تتفاعل مع أي محتوى بعد" icon="❤️" />;

    return (
        <>
            {data.map(reaction => (
                <div key={reaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${reaction.type === 'like'
                                ? 'bg-rose-50 dark:bg-rose-900/20'
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                            {reaction.type === 'like'
                                ? <FaHeart className="text-rose-500 text-xs" />
                                : <FaThumbsDown className="text-gray-500 dark:text-gray-400 text-xs" />
                            }
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {reaction.type === 'like' ? 'أعجبك' : 'لم يعجبك'}
                                {' '}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {reaction.reactionable_type === 'Article' ? 'مقالة' : 'تعليق'}
                                </span>
                            </p>
                            {reaction.reactionable?.title && (
                                <p className="text-sm text-gray-700 dark:text-gray-200 truncate mt-0.5">
                                    {reaction.reactionable.title}
                                </p>
                            )}
                            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                                {formatDate(reaction.created_at)}
                            </p>
                        </div>

                        {reaction.reactionable_type === 'Article' && reaction.reactionable_id && (
                            <a
                                href={`/posts/${reaction.reactionable_id}`}
                                className="text-gray-300 hover:text-primary transition-colors flex-shrink-0"
                                title="عرض المقالة"
                            >
                                <FaExternalLinkAlt className="text-xs" />
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
};

// ── Helpers ─────────────────────────────────────────────────
const formatDate = (str) => {
    if (!str) return '';
    const diff = Math.floor((Date.now() - new Date(str)) / 60000);
    if (diff < 60) return `منذ ${diff} دقيقة`;
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
    if (diff < 10080) return `منذ ${Math.floor(diff / 1440)} يوم`;
    return new Date(str).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
};

const TabButton = ({ active, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all border-b-2 ${active
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
    >
        <span className="text-xs">{icon}</span>
        {label}
        {count != null && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-primary/15 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                {count}
            </span>
        )}
    </button>
);

const LoadingState = () => (
    <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
);

const ErrorState = ({ msg }) => (
    <p className="text-center text-sm text-red-400 py-8">{msg}</p>
);

const EmptyState = ({ label, icon }) => (
    <div className="text-center py-10">
        <div className="text-4xl mb-2">{icon}</div>
        <p className="text-sm text-gray-400 dark:text-gray-500">{label}</p>
    </div>
);

export default ProfileActivity;
