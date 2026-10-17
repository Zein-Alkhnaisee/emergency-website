import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FaHeart, FaRegHeart,
  FaThumbsDown, FaRegThumbsDown,
  FaComment, FaEye, FaShare,
  FaBookmark, FaRegBookmark,
  FaUserCircle, FaClock, FaLink,
  FaEdit, FaTrash, FaLock,
} from 'react-icons/fa';
import { reactToPost } from '../../redux/slices/postsSlice';
import CommentsSection from './CommentsSection';
import { formatDate } from '../../utils/dateHelpers';

// ── Reaction Button (مُحسَّن) ──
const ReactionButton = memo(({ active, count, onClick, activeIcon, inactiveIcon, activeClass, label, isMember, navigate }) => {
  const [pressed, setPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (!isMember) {
      navigate('/login');
      return;
    }
    setPressed(true);
    setTimeout(() => setPressed(false), 200);
    onClick();
  }, [isMember, navigate, onClick]);

  return (
    <button
      onClick={handleClick}
      aria-label={`${label}${count > 0 ? ` (${count})` : ''}${!isMember ? ' — سجّل دخولك' : ''}`}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${active
          ? activeClass
          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:scale-105'
        } ${pressed ? 'scale-125' : ''}`} // ✅ أضف هنا
    >
      <span className={`text-sm ${active ? 'scale-110' : ''} transition-transform`} aria-hidden="true">
        {active ? activeIcon : inactiveIcon}
      </span>
      {count > 0 && <span className="text-xs font-medium">{count}</span>}
    </button>
  );
});
ReactionButton.displayName = 'ReactionButton';

// ── Main Card ──
const PostCard = memo(({
  post,
  index,
  isMember = false,
  isTrusted = false,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // استخراج بيانات post مع قيم افتراضية
  const {
    id: postId,
    title,
    content,
    cover_image: coverImage,
    category,
    created_at: createdAt,
    views = 0,
    comments_count: commentsCount = 0,
    reactions_count: reactionsCount = 0,
    dislikes_count: dislikesCount = 0,
    user_reaction: userReaction = null,
  } = post;

  const author = post.user || post.author || { name: 'مجهول', id: null, avatar: null, roles: [] };
  const isOwner = post.user_id && author?.id && Number(post.user_id) === Number(author.id);

  // ── State ──
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [localLikes, setLocalLikes] = useState(reactionsCount);
  const [localDislikes, setLocalDislikes] = useState(dislikesCount);
  const [localReaction, setLocalReaction] = useState(userReaction);


  const shareRef = useRef(null);
  const isAuthorTrusted = author?.roles?.includes('trusted');

  // ── Effects ──
  useEffect(() => {
    setLocalLikes(reactionsCount);
    setLocalDislikes(dislikesCount);
    setLocalReaction(userReaction);
  }, [reactionsCount, dislikesCount, userReaction]);

  // إغلاق مشاركة عند النقر خارجها
  useEffect(() => {
    if (!showShare) return;
    const handler = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showShare]);

  // ── Handlers (محسّنة بـ useCallback) ──
  const handleReaction = useCallback(async (type) => {
    if (!isMember) {
      navigate('/login');
      return;
    }

    const old = localReaction;
    if (old === type) {
      setLocalReaction(null);
      if (type === 'like') setLocalLikes(p => Math.max(0, p - 1));
      if (type === 'dislike') setLocalDislikes(p => Math.max(0, p - 1));
    } else {
      if (old === 'like') setLocalLikes(p => Math.max(0, p - 1));
      if (old === 'dislike') setLocalDislikes(p => Math.max(0, p - 1));
      if (type === 'like') setLocalLikes(p => p + 1);
      if (type === 'dislike') setLocalDislikes(p => p + 1);
      setLocalReaction(type);
    }

    const result = await dispatch(reactToPost({ postId, type }));
    if (reactToPost.rejected.match(result)) {
      setLocalLikes(reactionsCount);
      setLocalDislikes(dislikesCount);
      setLocalReaction(userReaction);
    }
  }, [isMember, localReaction, dispatch, postId, reactionsCount, dislikesCount, userReaction, navigate]);

  const handleCommentToggle = useCallback(() => {
    setShowComments(v => !v);
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
      setCopySuccess(true);
      setTimeout(() => { setCopySuccess(false); setShowShare(false); }, 1500);
    } catch {
      setShowShare(false);
    }
  }, [postId]);

  const handleBookmarkToggle = useCallback(() => {
    setIsBookmarked(v => !v);
  }, []);

  const handleShareToggle = useCallback(() => {
    setShowShare(v => !v);
  }, []);

  return (
    <article
      data-aos="fade-up"
      data-aos-duration="600"
      data-aos-delay={Math.min(index * 70, 300)}
      className="group relative bg-white dark:bg-gray-800/90 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700/60 hover:-translate-y-1 max-w-2xl mx-auto w-full"
    >
      {/* ── صورة الغلاف ── */}
      {coverImage && (
        <div className="relative h-52 sm:h-60 md:h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
          <img
            src={coverImage}
            alt={title}
            width={800}
            height={450}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain bg-gray-50 dark:bg-gray-800 transition-transform duration-700 group-hover:scale-[1.02]"
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && <div className="absolute inset-0 skeleton" aria-hidden="true" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

          {category && (
            <span className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg">
              {category}
            </span>
          )}

          <button
            onClick={handleBookmarkToggle}
            aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ المقال'}
            aria-pressed={isBookmarked}
            className="absolute top-3 left-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 rounded-full shadow hover:scale-110 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            {isBookmarked
              ? <FaBookmark className="text-primary text-sm" aria-hidden="true" />
              : <FaRegBookmark className="text-gray-600 dark:text-gray-300 text-sm" aria-hidden="true" />
            }
          </button>
        </div>
      )}

      {/* ── المحتوى ── */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {author?.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                width={40}
                height={40}
                style={{ aspectRatio: '1/1' }}
                className="w-10 h-10 rounded-full ring-2 ring-primary/20 object-cover"
                loading="lazy"
              />
            ) : (
              <FaUserCircle className="text-4xl text-gray-300 shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                {author?.name || 'مجهول'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <FaClock className="text-[10px]" aria-hidden="true" />
                <time dateTime={createdAt}>{formatDate(createdAt)}</time>
                {isAuthorTrusted && (
                  <span className="text-primary" aria-label="ناشر موثوق">· موثوق ✓</span>
                )}
              </div>
            </div>
          </div>

          {!coverImage && (
            <button
              onClick={handleBookmarkToggle}
              aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ المقال'}
              aria-pressed={isBookmarked}
              className="text-gray-400 hover:text-primary transition-all duration-200 hover:scale-110 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              {isBookmarked
                ? <FaBookmark className="text-primary" aria-hidden="true" />
                : <FaRegBookmark aria-hidden="true" />
              }
            </button>
          )}
        </div>

        {category && !coverImage && (
          <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full mb-3">
            {category}
          </span>
        )}

        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
          {content}
        </p>

        {/* ── الإحصائيات ── */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700/50">
          <span className="flex items-center gap-1" aria-label={`${views} مشاهدة`}>
            <FaEye aria-hidden="true" /> {views.toLocaleString('ar')}
          </span>
          <span className="flex items-center gap-1" aria-label={`${commentsCount} تعليق`}>
            <FaComment aria-hidden="true" /> {commentsCount.toLocaleString('ar')} تعليق
          </span>
          <span className="flex items-center gap-1" aria-label={`${localLikes} إعجاب`}>
            <FaHeart aria-hidden="true" /> {localLikes.toLocaleString('ar')} إعجاب
          </span>
        </div>

        {/* ── الأزرار ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ReactionButton
              active={localReaction === 'like'}
              count={localLikes}
              onClick={() => handleReaction('like')}
              activeIcon={<FaHeart />}
              inactiveIcon={<FaRegHeart />}
              activeClass="text-rose-500 bg-rose-50 dark:bg-rose-900/20"
              label="إعجاب"
              isMember={isMember}
              navigate={navigate}
            />

            <ReactionButton
              active={localReaction === 'dislike'}
              count={localDislikes}
              onClick={() => handleReaction('dislike')}
              activeIcon={<FaThumbsDown />}
              inactiveIcon={<FaRegThumbsDown />}
              activeClass="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
              label="عدم إعجاب"
              isMember={isMember}
              navigate={navigate}
            />

            <button
              onClick={handleCommentToggle}
              aria-expanded={showComments}
              aria-label={`${showComments ? 'إخفاء' : 'عرض'} التعليقات (${commentsCount})`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${showComments
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:scale-105'
                }`}
            >
              <FaComment className="text-sm" aria-hidden="true" />
              <span className="text-xs font-medium">
                {commentsCount > 0 ? commentsCount : 'تعليق'}
              </span>
            </button>
          </div>

          <div className="relative" ref={shareRef}>
            <button
              onClick={handleShareToggle}
              aria-label="مشاركة المقال"
              aria-expanded={showShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200 hover:scale-105"
            >
              <FaShare className="text-sm" aria-hidden="true" />
            </button>
            {showShare && (
              <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-1.5 min-w-[160px] border border-gray-100 dark:border-gray-700 z-10 animate-slide-in-down">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  <FaLink className="text-xs text-primary" aria-hidden="true" />
                  {copySuccess ? '✅ تم النسخ!' : 'نسخ الرابط'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── تسجيل الدخول ── */}
        {!isMember && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
            <FaLock className="text-gray-400 text-xs shrink-0" aria-hidden="true" />
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
              <button
                onClick={() => navigate('/login')}
                className="text-primary font-medium hover:underline transition-colors"
              >
                سجّل دخولك
              </button>
              {' '}للتفاعل مع المقالات وكتابة التعليقات
            </p>
          </div>
        )}

        {/* ── أزرار التعديل والحذف ── */}
        {isOwner && isTrusted && (onEdit || onDelete) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {onEdit && (
              <button
                onClick={() => onEdit(post)}
                aria-label="تعديل المقال"
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105"
              >
                <FaEdit size={11} aria-hidden="true" /> تعديل
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                aria-label="حذف المقال"
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200 hover:scale-105"
              >
                <FaTrash size={11} aria-hidden="true" /> حذف
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── التعليقات ── */}
      {showComments && (
        <div className="border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/30 px-5 pb-5 pt-4">
          <CommentsSection
            postId={postId}
            isMember={isMember}
          />
        </div>
      )}
    </article>
  );
});

PostCard.displayName = 'PostCard';
export default PostCard;