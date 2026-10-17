import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowRight } from 'react-icons/fa';
import { fetchArticleDetail } from '../redux/slices/postsSlice';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import PostCard from '../components/Posts/PostCard';
import CommentsSection from '../components/Posts/CommentsSection';

const PostDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { currentArticle, loading, error } = useSelector((state) => state.posts);

  useEffect(() => {
    if (id) {
      dispatch(fetchArticleDetail(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  if (!currentArticle) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-500">{t('posts.notFound')}</p>
        <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl animate-fade-up">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4"
      >
        <FaArrowRight /> {t('common.back')}
      </Link>

      <PostCard
        post={currentArticle}
        isMember={true}
        isTrusted={false}
      />

      <div className="mt-6">
        <CommentsSection postId={currentArticle.id} isMember={true} />
      </div>
    </div>
  );
};

export default PostDetailPage;