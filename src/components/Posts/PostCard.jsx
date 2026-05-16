import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FaHeart, FaRegHeart, FaThumbsDown, FaRegThumbsDown,
  FaComment, FaEye, FaShare, FaBookmark, FaRegBookmark, FaUserCircle,
} from 'react-icons/fa';
import { toggleLike, toggleDislike } from '../../redux/slices/postsSlice';
import CommentsSection from './CommentsSection';

const PostCard = ({ post, index }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const shareRef = useRef(null);

  // ✅ التحسين: إغلاق dropdown المشاركة عند الضغط خارجه
  useEffect(() => {
    if (!showShare) return;
    const handleClickOutside = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShowShare(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShare]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShare(false);
      }, 1500);
    } catch {
      setShowShare(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffMins < 1440) return `منذ ${Math.floor(diffMins / 60)} ساعة`;
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div
      data-aos="fade-up"
      data-aos-duration="700"
      data-aos-delay={index * 80}
      className="group bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-2"
    >
      {/* غلاف البطاقة */}
      <div className="relative h-48 bg-gradient-to-r from-primary/10 to-secondary/10 overflow-hidden">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-20 group-hover:opacity-30 transition">
            📰
          </div>
        )}

        <div className="absolute top-4 left-4">
          <span className="bg-primary/90 text-white text-xs px-3 py-1 rounded-full shadow-md">
            {post.category}
          </span>
        </div>

        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className="absolute top-4 right-4 bg-white/80 dark:bg-gray-900/80 p-2 rounded-full shadow-md hover:scale-110 transition-transform"
          aria-label={isBookmarked ? t('posts.removeBookmark') : t('posts.bookmark')}
        >
          {isBookmarked ? <FaBookmark className="text-primary" /> : <FaRegBookmark />}
        </button>
      </div>

      <div className="p-6">
        {/* بيانات المؤلف */}
        <div className="flex items-center gap-3 mb-4">
          {post.author?.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full ring-2 ring-primary/30 object-cover"
            />
          ) : (
            <FaUserCircle className="text-4xl text-gray-400 flex-shrink-0" />
          )}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white">{post.author?.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatDate(post.publishedAt)}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full ${post.author?.role === 'publisher' ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                {post.author?.role === 'publisher' ? t('posts.publisher') : t('posts.user')}
              </span>
            </div>
          </div>
        </div>

        {/* عنوان ومحتوى المقال */}
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 mb-4">
          {post.content}
        </p>

        {/* إحصائيات */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1"><FaEye /> {post.views}</div>
          <div className="flex items-center gap-1"><FaComment /> {post.comments?.length || 0}</div>
        </div>

        {/* أزرار التفاعل */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            {/* إعجاب */}
            <button
              onClick={() => dispatch(toggleLike(post.id))}
              className={`flex items-center gap-2 transition-all duration-300 hover:scale-110 ${post.isLikedByUser ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
              aria-label={t('posts.like')}
            >
              {post.isLikedByUser ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
              <span className="text-sm font-medium">{post.likes}</span>
            </button>

            {/* عدم إعجاب */}
            <button
              onClick={() => dispatch(toggleDislike(post.id))}
              className={`flex items-center gap-2 transition-all duration-300 hover:scale-110 ${post.isDislikedByUser ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              aria-label={t('posts.dislike')}
            >
              {post.isDislikedByUser ? <FaThumbsDown className="text-xl" /> : <FaRegThumbsDown className="text-xl" />}
              <span className="text-sm font-medium">{post.dislikes}</span>
            </button>

            {/* تعليق */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
              aria-label={t('posts.comment')}
            >
              <FaComment className="text-xl" />
              <span className="text-sm font-medium">{t('posts.comment')}</span>
            </button>
          </div>

          {/* ✅ التحسين: مشاركة مع إغلاق خارجي وتأكيد نسخ */}
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShowShare(!showShare)}
              className="text-gray-500 hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={t('posts.share')}
            >
              <FaShare className="text-lg" />
            </button>
            {showShare && (
              <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-2 z-10 min-w-[140px] border border-gray-100 dark:border-gray-700">
                <button
                  onClick={handleCopyLink}
                  className="w-full px-4 py-2 text-sm text-left whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {copySuccess ? '✅ ' + t('posts.linkCopied') : t('posts.copyLink')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* قسم التعليقات */}
      {showComments && (
        <div className="px-6 pb-6 pt-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          <CommentsSection postId={post.id} />
        </div>
      )}
    </div>
  );
};

export default PostCard;
