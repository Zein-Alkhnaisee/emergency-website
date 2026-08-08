import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowRight, FaEdit, FaTrash, FaHeart, FaRegHeart, FaThumbsDown, FaRegThumbsDown, FaEye } from 'react-icons/fa';
import { fetchMyComments, editComment, deleteComment, reactToComment, fetchMyReactions } from '../redux/slices/postsSlice';
import { confirmToast, showSuccess, showError } from '../utils/toastHelpers';
import Heading from '../components/Shared/Heading';

// عدد التعليقات المعروضة في الصفحة
const DISPLAY_LIMIT = 10;

const MyCommentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myComments, myReactions } = useSelector(state => state.posts);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [localComments, setLocalComments] = useState([]);

  // ── جلب التعليقات والتفاعلات ──
  useEffect(() => {
    dispatch(fetchMyComments({ perPage: 100 }));
    dispatch(fetchMyReactions({ perPage: 100 }));
  }, [dispatch]);

  // ── بناء قائمة التعليقات مع التفاعلات ──
  useEffect(() => {
    if (myComments.data) {
      const reactionMap = {};
      if (myReactions.data) {
        myReactions.data.forEach(r => {
          if (r.reactionable_type === 'Comment') {
            reactionMap[r.reactionable_id] = r.type;
          }
        });
      }

      const enriched = myComments.data.map(c => ({
        ...c,
        user_reaction: reactionMap[c.id] || c.user_reaction || null,
        reactions_count: c.reactions_count || 0,
        dislikes_count: c.dislikes_count || 0,
      }));
      setLocalComments(enriched);
    }
  }, [myComments.data, myReactions.data]);

  // ── التعديل ──
  const handleEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await dispatch(editComment({ commentId, content: editText.trim() })).unwrap();
      showSuccess('تم تعديل التعليق');
      setEditingCommentId(null);
      setLocalComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, content: editText.trim() } : c
      ));
    } catch (err) {
      showError('فشل التعديل');
    }
  };

  // ── الحذف ──
  const handleDelete = (commentId, articleId) => {
    confirmToast('هل تريد حذف هذا التعليق نهائياً؟', async () => {
      try {
        await dispatch(deleteComment({ commentId, articleId })).unwrap();
        showSuccess('تم حذف التعليق');
        setLocalComments(prev => prev.filter(c => c.id !== commentId));
      } catch (err) {
        showError('فشل الحذف');
      }
    });
  };

  // ── التفاعل ──
  const handleReaction = async (commentId, type) => {
    const commentIndex = localComments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    const oldComment = localComments[commentIndex];
    const oldReaction = oldComment.user_reaction;

    let newReaction = oldReaction;
    let newLikes = oldComment.reactions_count;
    let newDislikes = oldComment.dislikes_count;

    if (oldReaction === type) {
      newReaction = null;
      if (type === 'like') newLikes = Math.max(0, newLikes - 1);
      if (type === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
    } else {
      if (oldReaction === 'like') newLikes = Math.max(0, newLikes - 1);
      if (oldReaction === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
      if (type === 'like') newLikes += 1;
      if (type === 'dislike') newDislikes += 1;
      newReaction = type;
    }

    const updatedComments = [...localComments];
    updatedComments[commentIndex] = {
      ...oldComment,
      user_reaction: newReaction,
      reactions_count: newLikes,
      dislikes_count: newDislikes,
    };
    setLocalComments(updatedComments);

    try {
      await dispatch(reactToComment({ commentId, type })).unwrap();
    } catch (err) {
      updatedComments[commentIndex] = oldComment;
      setLocalComments(updatedComments);
      showError('فشل التفاعل');
    }
  };

  // ── الانتقال إلى المقالة ──
  const goToArticle = (articleId) => {
    if (articleId) {
      navigate(`/post/${articleId}`);
    }
  };

  // ── حالة التحميل ──
  if (myComments.loading && localComments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 mt-4">جاري التحميل...</p>
      </div>
    );
  }

  // ── حالة الخطأ ──
  if (myComments.error && localComments.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{myComments.error}</p>
        <button
          onClick={() => dispatch(fetchMyComments({ perPage: 100 }))}
          className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ── العرض الرئيسي ──
  const displayedComments = localComments.slice(0, DISPLAY_LIMIT);
  const hasMore = localComments.length > DISPLAY_LIMIT;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Heading title="تعليقاتي" subtitle="جميع التعليقات التي كتبتها على المقالات" />
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
        >
          <FaArrowRight /> رجوع إلى المقالات
        </button>
      </div>

      {localComments.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-400">لا توجد تعليقات بعد.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {displayedComments.map(comment => (
              <div
                key={comment.id}
                className="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => goToArticle(comment.on?.id || comment.article_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToArticle(comment.on?.id || comment.article_id);
                  }
                }}
              >
                {editingCommentId === comment.id ? (
                  // ── وضع التعديل ──
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={3}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(comment.id)} className="px-3 py-1 bg-primary text-white rounded-lg text-sm">حفظ</button>
                      <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-gray-200 rounded-lg text-sm">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  // ── عرض التعليق ──
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>
                    <div className="text-xs text-gray-400 mb-3 flex items-center gap-2 flex-wrap">
                      <span>
                        في مقال: <span className="font-medium text-primary hover:underline">
                          {comment.on?.title || `#${comment.on?.id}`}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{new Date(comment.created_at).toLocaleDateString('ar-EG')}</span>
                      <span className="flex items-center gap-1 text-primary">
                        <FaEye className="text-[10px]" /> اضغط للعرض
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleReaction(comment.id, 'like')}
                          className={`flex items-center gap-1 text-xs transition ${
                            comment.user_reaction === 'like' ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                          }`}
                        >
                          {comment.user_reaction === 'like' ? <FaHeart /> : <FaRegHeart />}
                          {comment.reactions_count > 0 && <span>{comment.reactions_count}</span>}
                        </button>
                        <button
                          onClick={() => handleReaction(comment.id, 'dislike')}
                          className={`flex items-center gap-1 text-xs transition ${
                            comment.user_reaction === 'dislike' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 hover:text-gray-500'
                          }`}
                        >
                          {comment.user_reaction === 'dislike' ? <FaThumbsDown /> : <FaRegThumbsDown />}
                          {comment.dislikes_count > 0 && <span>{comment.dislikes_count}</span>}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(comment)} className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
                          <FaEdit size={12} /> تعديل
                        </button>
                        <button onClick={() => handleDelete(comment.id, comment.on?.id)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                          <FaTrash size={12} /> حذف
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ── زر عرض المزيد ── */}
          {hasMore && (
            <div className="text-center mt-8">
              <Link
                to={`/all-comments`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-medium shadow-md hover:shadow-lg"
              >
                عرض جميع التعليقات ({localComments.length})
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyCommentsPage;