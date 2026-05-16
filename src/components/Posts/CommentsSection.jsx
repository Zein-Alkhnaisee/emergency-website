import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { addComment } from '../../redux/slices/postsSlice';
import { FaUserCircle, FaPaperPlane } from 'react-icons/fa';

const CommentsSection = ({ postId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [newComment, setNewComment] = useState('');

  // ✅ التحسين: نعتمد على Redux كـ single source of truth بدل localComments
  const comments = useSelector(
    (state) => state.posts.posts.find((p) => p.id === postId)?.comments || []
  );

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      author: {
        name: 'مستخدم مؤقت',
        avatar: null,
      },
      content: newComment,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    dispatch(addComment({ postId, comment }));
    setNewComment('');
  };

  // ✅ التحسين: دعم الضغط على Enter لإرسال التعليق
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return 'الآن';
    if (diff < 60) return `منذ ${diff} دقيقة`;
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
        {t('posts.comments')} ({comments.length})
      </h4>

      {/* إضافة تعليق جديد */}
      <div className="flex gap-3 mb-6">
        <FaUserCircle className="text-4xl text-gray-400 flex-shrink-0" />
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('posts.writeComment')}
            className="w-full p-3 pr-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            rows="2"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="absolute bottom-3 right-3 text-primary hover:text-primary/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={t('posts.sendComment')}
          >
            <FaPaperPlane className="text-xl" />
          </button>
        </div>
      </div>

      {/* قائمة التعليقات */}
      {comments.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">
          {t('posts.noComments', 'لا توجد تعليقات بعد. كن أول من يعلّق!')}
        </p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {comment.author?.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                />
              ) : (
                <FaUserCircle className="text-3xl text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800 dark:text-white">
                      {comment.author?.name || 'مجهول'}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
