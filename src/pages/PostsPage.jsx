import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaBookmark, FaComment } from 'react-icons/fa';
import {
  fetchPosts,
  fetchMyReactionsAndMerge,
  fetchMyCommentReactionsAndMerge,
  deletePost,
} from '../redux/slices/postsSlice';
import Heading from '../components/Shared/Heading';
import PostCard from '../components/Posts/PostCard';
import PostFilters from '../components/Posts/PostFilters';
import CreatePostModal from '../components/Posts/CreatePostModel';
import EditPostModal from '../components/Posts/EditPostModal';
import Button from '../components/Shared/Button';
import { confirmToast, showSuccess, showError } from '../utils/toastHelpers';
import { SkeletonPostCard } from '../components/UI/Skeleton';
import TiltCard from '../components/UI/3DTiltCard';

const DISPLAY_LIMIT = 5;

const PostsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { posts, loading, error, filter, category, pagination } = useSelector(s => s.posts);
  const { currentUser, roles } = useSelector(s => s.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const isMember = !!currentUser;
  const isTrusted = !!(
    roles?.includes('trusted') ||
    currentUser?.roles?.includes('trusted') ||
    currentUser?.role === 'trusted'
  );

  // ── جلب المقالات من API (مع إرسال search) ──
  useEffect(() => {
    dispatch(fetchPosts({ page, perPage: 10, search }));
  }, [dispatch, page, search]);

  // ── جلب تفاعلاتي ──
  useEffect(() => {
    if (!isMember || loading || posts.length === 0) return;
    dispatch(fetchMyReactionsAndMerge());
    dispatch(fetchMyCommentReactionsAndMerge());
  }, [dispatch, isMember, loading, posts.length]);

  // ── معالج البحث ──
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setSearch(trimmed);
    setPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }, []);

  const handleDeletePost = (postId) => {
    confirmToast(t('posts.confirmDelete'), async () => {
      try {
        await dispatch(deletePost(postId)).unwrap();
        showSuccess(t('posts.articleDeleted'));
      } catch (err) {
        showError(err || t('posts.deleteFailed'));
      }
    });
  };

  // ── تصفية المقالات (بما في ذلك البحث على العميل) ──
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // 1. تصفية حسب التصنيف (category)
    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    // 2. تصفية حسب البحث (client‑side) إذا كان هناك مصطلح بحث
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(lowerSearch) ||
        p.content?.toLowerCase().includes(lowerSearch) ||
        p.user?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    // 3. ترتيب حسب الفلتر المختار
    switch (filter) {
      case 'trending':
        return result.sort((a, b) =>
          (b.reactions_count + b.comments_count) - (a.reactions_count + a.comments_count)
        );
      case 'mostLiked':
        return result.sort((a, b) => b.reactions_count - a.reactions_count);
      case 'mostCommented':
        return result.sort((a, b) => b.comments_count - a.comments_count);
      default:
        return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [posts, filter, category, search]);

  const displayedPosts = filteredPosts.slice(0, DISPLAY_LIMIT);
  const hasMore = filteredPosts.length > DISPLAY_LIMIT;

  // ── حالات التحميل والخطأ ──
  if (loading && page === 1 && posts.length === 0) {
    return (
      <div className="container my-10 px-4">
        <Heading title={t('posts.articlesAndAwareness')} subtitle={t('posts.tipsAndGuidance')} />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonPostCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="container my-10 px-4">
        <Heading title={t('posts.title')} subtitle={t('posts.subtitle')} />
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => dispatch(fetchPosts({ page, perPage: 10, search }))}
            className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-10 px-4">
      <Heading title={t('posts.articlesAndAwareness')} subtitle={t('posts.tipsAndGuidance')} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* شريط البحث المحسَّن */}
        <form onSubmit={handleSearch} className="flex w-full sm:max-w-sm gap-2" role="search">
          <div className="relative flex-1">
            <FaSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('posts.searchArticles')}
              aria-label={t('posts.searchArticles')}
              className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm"
                aria-label="مسح البحث"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label={t('common.search')}
            disabled={!searchInput.trim() && search === ''}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.search')}
          </button>
        </form>

        <div className="flex gap-2 flex-wrap justify-end">
          {isMember && (
            <>
              <Link to="/my-articles">
                <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md hover:shadow-[var(--color-primary)]/20 active:scale-[0.98] flex items-center gap-2">
                  <FaBookmark className="inline" aria-hidden="true" />
                  {t('posts.myArticles')}
                </button>
              </Link>
              <Link to="/my-comments">
                <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md hover:shadow-[var(--color-primary)]/20 active:scale-[0.98] flex items-center gap-2">
                  <FaComment className="inline" aria-hidden="true" />
                  {t('posts.myComments')}
                </button>
              </Link>
            </>
          )}
          {isTrusted && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] flex items-center gap-2"
            >
              <FaPlus className="inline" aria-hidden="true" />
              {t('posts.writeNewArticle')}
            </button>
          )}
        </div>
      </div>

      <PostFilters />

      {!isMember && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3 animate-fade-up">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-primary">{t('posts.loginRequired')}</span> {t('posts.loginToInteract')}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="shrink-0 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98]"
          >
            {t('login')}
          </button>
        </div>
      )}

      {displayedPosts.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <div className="text-7xl mb-4">📭</div>
          <p className="text-gray-400">
            {search ? t('posts.noSearchResults', 'لا توجد نتائج للبحث عن "{{search}}"')?.replace('{{search}}', search) : t('posts.noPosts')}
          </p>
          {search && (
            <button
              onClick={handleClearSearch}
              className="mt-4 text-primary hover:underline transition-colors text-sm"
            >
              عرض جميع المقالات
            </button>
          )}
        </div>
      ) : (
        <>
          {search && (
            <p className="text-sm text-gray-400 mb-4 animate-fade-up">
              نتائج البحث عن: <span className="font-medium text-primary">{search}</span> ({filteredPosts.length} مقال)
            </p>
          )}
          <div className="space-y-6">
            {displayedPosts.map((post, index) => (
              <TiltCard key={post.id} tiltMaxAngle={4} glare>
                <PostCard
                  post={post}
                  index={index}
                  isMember={isMember}
                  isTrusted={isTrusted}
                  onEdit={isTrusted ? (p) => { setEditPost(p); setIsEditModalOpen(true); } : undefined}
                  onDelete={isTrusted ? handleDeletePost : undefined}
                />
              </TiltCard>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8 animate-fade-up">
              <Link
                to={`/all-articles?filter=${filter}&category=${category}&search=${search}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] shadow-md"
              >
                {t('posts.showAllArticles')}
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  +{filteredPosts.length - DISPLAY_LIMIT}
                </span>
              </Link>
            </div>
          )}
        </>
      )}

      {isTrusted && (
        <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={editPost}
      />
    </div>
  );
};

export default PostsPage;