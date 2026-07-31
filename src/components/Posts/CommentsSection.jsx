import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaUserCircle, FaPaperPlane, FaShieldAlt,
  FaEdit, FaTrash, FaHeart, FaRegHeart,
  FaThumbsDown, FaRegThumbsDown, FaLock,
} from 'react-icons/fa';
import {
  fetchArticleComments,
  addComment,
  editComment,
  deleteComment,
  reactToComment,
} from '../../redux/slices/postsSlice';
import { confirmToast, showSuccess, showError } from '../../utils/toastHelpers.jsx';
import { formatDate } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';

// ── Comments section ───────────────────────────────────────────
const CommentsSection = ({ postId, isMember = false }) => {
  const { t } = useTranslation();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);

  const bucket   = useSelector(s => s.posts.commentsByArticle[postId]);
  const comments = bucket?.data    || [];
  const loading  = bucket?.loading || false;
  const error    = bucket?.error   || null;
  const { currentUser } = useSelector(s => s.user);

  // جلب التعليقات للجميع (لا يحتاج token)
  useEffect(() => {
    if (!bucket) dispatch(fetchArticleComments({ articleId: postId }));
  }, [postId, dispatch, bucket]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    if (!isMember) { navigate('/login'); return; }
    setSending(true);
    const result = await dispatch(addComment({ postId, content: text.trim() }));
    if (addComment.fulfilled.match(result)) {
      setText('');
      showSuccess(t('comments.addedSuccess'));
    } else {
      showError(result.payload || t('comments.addFailed'));
    }
    setSending(false);
  }, [text, sending, isMember, dispatch, postId, navigate, t]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div>
      {/* Header */}
      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        {t('comments.title')}
        {comments.length > 0 && (
          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
            {comments.length}
          </span>
        )}
      </h4>

      {/* ── Input area ── */}
      {isMember ? (
        /* مسجل — يمكنه الكتابة */
        <div className="flex gap-3 mb-5">
          <FaUserCircle className="text-3xl text-gray-300 dark:text-gray-600 shrink-0 mt-1" aria-hidden="true" />
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('comments.writeComment')}
              aria-label={t('comments.writeComment')}
              rows={2}
              disabled={sending}
              className="w-full pr-4 pl-10 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              aria-label={t('comments.sendComment')}
              className="absolute bottom-2.5 left-2.5 text-primary hover:text-primary/70 disabled:opacity-30 disabled:cursor-not-allowed transition min-w-[28px] min-h-[28px] flex items-center justify-center"
            >
              <FaPaperPlane className={sending ? 'animate-pulse' : ''} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        /* زائر — يرى التعليقات ولكن لا يكتب */
        <div className="mb-5 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
          <FaLock className="text-gray-400 text-xs shrink-0" aria-hidden="true" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={() => navigate('/login')}
              className="text-primary font-medium hover:underline"
            >
              {t('comments.loginToComment')}
            </button>
            {' '}{t('comments.loginToCommentSuffix')}
          </p>
        </div>
      )}

      {/* ── Comments list ── */}
      {loading ? (
        <div className="flex justify-center py-6" role="status" aria-label={t('common.loading')}>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-400 py-4" role="alert">{error}</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
          {t('comments.noComments')}
        </p>
      ) : (
        <div
          className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar"
          role="list"
          aria-label={t('comments.list')}
        >
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              isMember={isMember}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Comment item ───────────────────────────────────────────────
const CommentItem = ({ comment, postId, isMember, currentUserId }) => {
  const { t } = useTranslation();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [isEditing,    setIsEditing]    = useState(false);
  const [editText,     setEditText]     = useState(comment.content);
  const [deleting,     setDeleting]     = useState(false);
  const [localReaction, setLocalReaction] = useState(comment.user_reaction || null);
  const [localLikes,    setLocalLikes]    = useState(comment.reactions_count || 0);
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes_count  || 0);

  const commentUserId = comment.author?.id ?? null;
  const isOwner       = !!(currentUserId && commentUserId && currentUserId === commentUserId);
  const isWeighted    = comment.is_weighted;

  const handleEdit = async () => {
    if (!editText.trim() || editText === comment.content) { setIsEditing(false); return; }
    try {
      await dispatch(editComment({ commentId: comment.id, content: editText.trim() })).unwrap();
      showSuccess(t('comments.editSuccess'));
      setIsEditing(false);
    } catch {
      showError(t('comments.editFailed'));
    }
  };

  const handleDelete = () => {
    confirmToast(t('comments.confirmDelete'), async () => {
      setDeleting(true);
      try {
        await dispatch(deleteComment({ commentId: comment.id, articleId: postId })).unwrap();
        showSuccess(t('comments.deleteSuccess'));
      } catch {
        showError(t('comments.deleteFailed'));
        setDeleting(false);
      }
    });
  };

  const handleReaction = useCallback(async (type) => {
    if (!isMember) { navigate('/login'); return; }
    const old = localReaction;
    if (old === type) {
      setLocalReaction(null);
      if (type === 'like')    setLocalLikes(p => Math.max(0, p - 1));
      if (type === 'dislike') setLocalDislikes(p => Math.max(0, p - 1));
    } else {
      if (old === 'like')    setLocalLikes(p => Math.max(0, p - 1));
      if (old === 'dislike') setLocalDislikes(p => Math.max(0, p - 1));
      if (type === 'like')    setLocalLikes(p => p + 1);
      if (type === 'dislike') setLocalDislikes(p => p + 1);
      setLocalReaction(type);
    }
    const result = await dispatch(reactToComment({ commentId: comment.id, type }));
    if (reactToComment.rejected.match(result)) {
      setLocalReaction(comment.user_reaction || null);
      setLocalLikes(comment.reactions_count  || 0);
      setLocalDislikes(comment.dislikes_count || 0);
    }
  }, [isMember, localReaction, dispatch, comment, navigate]);

  if (deleting) return null;

  return (
    <div className="flex gap-2.5 group" role="listitem">
      {/* Avatar */}
      {comment.author?.avatar ? (
        <img
          src={comment.author.avatar}
          alt={comment.author.name}
          width={32} height={32}
          style={{ aspectRatio: '1/1' }}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
          loading="lazy"
        />
      ) : (
        <FaUserCircle className="text-2xl text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" aria-hidden="true" />
      )}

      <div className="flex-1 min-w-0">
        <div className={`rounded-xl px-3.5 py-2.5 ${
          isWeighted
            ? 'bg-primary/5 dark:bg-primary/10 border border-primary/20'
            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50'
        }`}>
          {/* Author row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold text-gray-800 dark:text-white">
              {comment.author?.name || t('common.unknown')}
            </span>
            {isWeighted && (
              <span className="flex items-center gap-1 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">
                <FaShieldAlt className="text-[9px]" aria-hidden="true" /> {t('comments.trusted')}
              </span>
            )}
            <time
              dateTime={comment.created_at}
              className="text-[10px] text-gray-400 mr-auto"
            >
              {formatDate(comment.created_at)}
            </time>
          </div>

          {/* Content / Edit form */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={2}
                aria-label={t('comments.editPlaceholder')}
                autoFocus
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition"
                >
                  {t('common.save')}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-words">
              {comment.content}
            </p>
          )}

          {/* Reactions + actions */}
          <div className="flex items-center justify-between mt-2">
            {/* Like / Dislike */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReaction('like')}
                aria-label={`${t('comments.like')}${localLikes > 0 ? ` (${localLikes})` : ''}${!isMember ? ` — ${t('comments.loginRequired')}` : ''}`}
                aria-pressed={localReaction === 'like'}
                className={`flex items-center gap-1 text-xs transition min-h-[28px] ${
                  localReaction === 'like' ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                }`}
              >
                {localReaction === 'like'
                  ? <FaHeart aria-hidden="true" />
                  : <FaRegHeart aria-hidden="true" />
                }
                {localLikes > 0 && <span>{localLikes}</span>}
              </button>

              <button
                onClick={() => handleReaction('dislike')}
                aria-label={`${t('comments.dislike')}${localDislikes > 0 ? ` (${localDislikes})` : ''}${!isMember ? ` — ${t('comments.loginRequired')}` : ''}`}
                aria-pressed={localReaction === 'dislike'}
                className={`flex items-center gap-1 text-xs transition min-h-[28px] ${
                  localReaction === 'dislike' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                {localReaction === 'dislike'
                  ? <FaThumbsDown aria-hidden="true" />
                  : <FaRegThumbsDown aria-hidden="true" />
                }
                {localDislikes > 0 && <span>{localDislikes}</span>}
              </button>
            </div>

            {/* Edit / Delete — owner only */}
            {isOwner && !isEditing && (
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  aria-label={t('comments.edit')}
                  className="text-xs text-blue-500 hover:text-blue-700 min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <FaEdit size={12} aria-hidden="true" />
                </button>
                <button
                  onClick={handleDelete}
                  aria-label={t('comments.delete')}
                  className="text-xs text-red-500 hover:text-red-700 min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <FaTrash size={12} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;