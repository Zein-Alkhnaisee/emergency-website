import { useState, useEffect, useMemo } from 'react';
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

const PostsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { posts, loading, error, filter, category, pagination } = useSelector(s => s.posts);
  const { currentUser, roles } = useSelector(s => s.user);

  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPost,        setEditPost]        = useState(null);
  const [page,            setPage]            = useState(1);
  const [search,          setSearch]          = useState('');
  const [searchInput,     setSearchInput]     = useState('');

  const isMember  = !!currentUser;
  const isTrusted = !!(
    roles?.includes('trusted') ||
    currentUser?.roles?.includes('trusted') ||
    currentUser?.role === 'trusted'
  );

  useEffect(() => {
    dispatch(fetchPosts({ page, perPage: 10, search }));
  }, [dispatch, page, search]);

  useEffect(() => {
    if (!isMember || loading || posts.length === 0) return;
    dispatch(fetchMyReactionsAndMerge());
    dispatch(fetchMyCommentReactionsAndMerge());
  }, [dispatch, isMember, loading, posts.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

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

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (category !== 'all') result = result.filter(p => p.category === category);
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
  }, [posts, filter, category]);

  if (loading && page === 1 && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="container my-10 px-4">
        <Heading title={t('posts.title')} subtitle={t('posts.subtitle')} />
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => dispatch(fetchPosts({ page, perPage: 10, search }))}
            className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-medium"
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
        <form onSubmit={handleSearch} className="flex w-full sm:max-w-sm gap-2" role="search">
          <div className="relative flex-1">
            <FaSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t('posts.searchArticles')}
              aria-label={t('posts.searchArticles')}
              className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            aria-label={t('common.search')}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition"
          >
            {t('common.search')}
          </button>
        </form>

        <div className="flex gap-2 flex-wrap justify-end">
          {isMember && (
            <>
              <Link to="/my-articles">
                <Button
                  text={t('posts.myArticles')}
                  bgColor="bg-gray-100 dark:bg-gray-700"
                  textColor="text-gray-700 dark:text-gray-200"
                  icon={<FaBookmark className="inline ml-1.5" aria-hidden="true" />}
                  ariaLabel={t('posts.myArticles')}
                />
              </Link>
              <Link to="/my-comments">
                <Button
                  text={t('posts.myComments')}
                  bgColor="bg-gray-100 dark:bg-gray-700"
                  textColor="text-gray-700 dark:text-gray-200"
                  icon={<FaComment className="inline ml-1.5" aria-hidden="true" />}
                  ariaLabel={t('posts.myComments')}
                />
              </Link>
            </>
          )}
          {isTrusted && (
            <Button
              text={t('posts.writeNewArticle')}
              bgColor="bg-primary"
              textColor="text-white"
              handler={() => setIsModalOpen(true)}
              icon={<FaPlus className="inline ml-1.5" aria-hidden="true" />}
              ariaLabel={t('posts.writeNewArticle')}
            />
          )}
        </div>
      </div>

      <PostFilters />

      {!isMember && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium text-primary">{t('posts.loginRequired')}</span> {t('posts.loginToInteract')}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="shrink-0 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition"
          >
            {t('login')}
          </button>
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-7xl mb-4">📭</div>
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
              onEdit={isTrusted ? (p) => { setEditPost(p); setIsEditModalOpen(true); } : undefined}
              onDelete={isTrusted ? handleDeletePost : undefined}
            />
          ))}
        </div>
      )}

      {pagination.lastPage > 1 && (
        <nav aria-label={t('posts.pagination')} className="flex items-center justify-center gap-2 mt-10">
          <PaginationButton
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            label={t('posts.previous')}
          />
          <div className="flex gap-1" role="list">
            {buildPageList(page, pagination.lastPage).map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400" aria-hidden="true">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`${t('posts.page')} ${p}`}
                  aria-current={page === p ? 'page' : undefined}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    page === p
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
          <PaginationButton
            onClick={() => setPage(p => Math.min(pagination.lastPage, p + 1))}
            disabled={page === pagination.lastPage}
            label={t('posts.next')}
          />
        </nav>
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

// ── Helpers ────────────────────────────────────────────────────
const buildPageList = (currentPage, lastPage) =>
  Array.from({ length: lastPage }, (_, i) => i + 1)
    .filter(p => p === 1 || p === lastPage || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

const PaginationButton = ({ onClick, disabled, label }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
  >
    {label}
  </button>
);

export default PostsPage;