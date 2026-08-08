// src/pages/AllArticlesPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import {
  fetchPosts,
  setFilter,
  setCategory,
  deletePost,
} from '../redux/slices/postsSlice';
import Heading from '../components/Shared/Heading';
import PostCard from '../components/Posts/PostCard';
import PostFilters from '../components/Posts/PostFilters';
import { confirmToast, showSuccess, showError } from '../utils/toastHelpers';

const AllArticlesPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── قراءة الفلاتر من URL ──
  const filter = searchParams.get('filter') || 'all';
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';

  // ── جلب حالة المستخدم ──
  const { currentUser, roles } = useSelector((state) => state.user);
  const { posts, loading, error, pagination } = useSelector((state) => state.posts);

  const [page, setPage] = useState(1);
  const perPage = 15;

  // ── تحديد إذا كان المستخدم مسجلاً وموثقاً ──
  const isMember = !!currentUser;
  const isTrusted = !!(
    roles?.includes('trusted') ||
    currentUser?.roles?.includes('trusted') ||
    currentUser?.role === 'trusted'
  );

  // ── تحديث الفلتر والتصنيف من الـ URL ──
  useEffect(() => {
    if (filter) dispatch(setFilter(filter));
    if (category) dispatch(setCategory(category));
  }, [filter, category, dispatch]);

  // ── جلب المقالات ──
  useEffect(() => {
    dispatch(fetchPosts({ page, perPage, search }));
  }, [dispatch, page, search]);

  // ── تصفية وترتيب المقالات ──
  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (category !== 'all') result = result.filter((p) => p.category === category);
    switch (filter) {
      case 'trending':
        return result.sort(
          (a, b) =>
            b.reactions_count + b.comments_count - (a.reactions_count + a.comments_count)
        );
      case 'mostLiked':
        return result.sort((a, b) => b.reactions_count - a.reactions_count);
      case 'mostCommented':
        return result.sort((a, b) => b.comments_count - a.comments_count);
      default:
        return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [posts, filter, category]);

  // ── دالة حذف المقال ──
  const handleDeletePost = (postId) => {
    confirmToast(t('posts.confirmDelete'), async () => {
      try {
        await dispatch(deletePost(postId)).unwrap();
        showSuccess(t('posts.articleDeleted'));
        // تحديث القائمة بعد الحذف (اختياري، لكن يمكنك إعادة جلب الصفحة الحالية)
        dispatch(fetchPosts({ page, perPage, search }));
      } catch (err) {
        showError(err || t('posts.deleteFailed'));
      }
    });
  };

  // ── دالة تعديل المقال (توجه لصفحة التعديل) ──
  const handleEditPost = (post) => {
    // إذا كان لديك صفحة تعديل مستقلة
    navigate(`/edit-post/${post.id}`);
    // أو يمكنك فتح مودال هنا
    // setEditPost(post);
    // setIsEditModalOpen(true);
  };

  // ── التنقل بين الصفحات ──
  const nextPage = () => {
    if (page < pagination.lastPage) setPage((p) => p + 1);
  };
  const prevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  // ── حالة التحميل ──
  if (loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 mt-4">{t('common.loading')}</p>
      </div>
    );
  }

  // ── حالة الخطأ ──
  if (error && posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => dispatch(fetchPosts({ page, perPage, search }))}
          className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  // ── العرض الرئيسي ──
  return (
    <div className="container mx-auto px-4 py-10">
      {/* شريط العنوان وزر الرجوع */}
      <div className="flex items-center justify-between mb-6">
        <Heading title={t('posts.allArticles')} subtitle={t('posts.browseAll')} />
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <FaArrowRight /> {t('common.back')}
        </Link>
      </div>

      {/* الفلاتر */}
      <PostFilters />

      {/* قائمة المقالات */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400">{t('posts.noPosts')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              isMember={isMember}
              isTrusted={isTrusted}
              // ✅ تمرير الدوال بشكل صحيح، فقط إذا كان المستخدم موثقاً
              onEdit={isTrusted ? handleEditPost : undefined}
              onDelete={isTrusted ? handleDeletePost : undefined}
            />
          ))}
        </div>
      )}

      {/* الترقيم (Pagination) */}
      {pagination.lastPage > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={prevPage}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('posts.previous')}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {t('posts.page')} {page} / {pagination.lastPage}
          </span>
          <button
            onClick={nextPage}
            disabled={page === pagination.lastPage}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('posts.next')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AllArticlesPage;