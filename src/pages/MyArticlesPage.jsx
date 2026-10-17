import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaEdit, FaTrash, FaTrashRestore, FaTrashAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { 
  fetchMyArticles, 
  deletePost, 
  restorePost, 
  forceDeletePost, 
  fetchTrashedArticles 
} from '../redux/slices/postsSlice';
import EditPostModal from '../components/Posts/EditPostModal';
import { confirmToast, showSuccess, showError } from './../utils/toastHelpers';
import { useTranslation } from 'react-i18next';

const MyArticlesPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myArticles, trashedArticles } = useSelector(state => state.posts);
  const [tab, setTab] = useState('published');
  const [editPost, setEditPost] = useState(null);

  useEffect(() => {
    if (tab === 'trash') {
      dispatch(fetchTrashedArticles({ page: 1 }));
    } else {
      let status = null;
      if (tab === 'pending') status = 'pending';
      if (tab === 'rejected') status = 'rejected';
      if (tab === 'published') status = 'approved';
      dispatch(fetchMyArticles({ status, page: 1, perPage: 20 }));
    }
  }, [tab, dispatch]);

  const handleSoftDelete = (id) => {
    confirmToast(t('posts.confirmTrash'), async () => {
      try {
        await dispatch(deletePost(id)).unwrap();
        showSuccess(t('posts.articleTrashed'));
      } catch (err) {
        showError(t('posts.deleteFailed'));
      }
    });
  };

  const handleRestore = (id) => {
    confirmToast(t('posts.confirmRestore'), async () => {
      try {
        await dispatch(restorePost(id)).unwrap();
        showSuccess(t('posts.articleRestored'));
      } catch (err) {
        showError(t('posts.restoreFailed'));
      }
    });
  };

  const handleForceDelete = (id) => {
    confirmToast(t('posts.confirmForceDelete'), async () => {
      try {
        await dispatch(forceDeletePost(id)).unwrap();
        showSuccess(t('posts.articleForceDeleted'));
      } catch (err) {
        showError(t('posts.forceDeleteFailed'));
      }
    }, t('posts.forceDeleteConfirm'), t('common.cancel'));
  };

  const articles = tab === 'trash' ? trashedArticles.data : myArticles.data;
  const loading = tab === 'trash' ? trashedArticles.loading : myArticles.loading;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('posts.myArticles')}</h1>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          <FaArrowRight /> {t('posts.backToPosts')}
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {[
          { key: 'published', label: t('posts.published') },
          { key: 'pending', label: t('posts.pending') },
          { key: 'rejected', label: t('posts.rejected') },
          { key: 'trash', label: t('posts.trashBin') }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-5 py-2 text-sm font-medium transition-all duration-200 ${
              tab === item.key 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-10 text-gray-400">{t('common.loading')}</div>}
      {!loading && articles?.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t('posts.noArticles')}</p>
      )}
      <div className="space-y-3">
        {articles?.map(article => (
          <div key={article.id} className="border rounded-xl p-4 flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700">
            <div>
              <Link to={`/posts/${article.id}`} className="font-semibold hover:text-primary transition-colors text-gray-800 dark:text-white">
                {article.title}
              </Link>
              <div className="text-xs text-gray-400 mt-1">
                {t('posts.status')}: {article.status === 'approved' ? t('posts.published') : article.status === 'pending' ? t('posts.pending') : t('posts.rejected')}
              </div>
            </div>
            <div className="flex gap-2">
              {tab !== 'trash' ? (
                <>
                  <button onClick={() => setEditPost(article)} className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleSoftDelete(article.id)} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 hover:scale-105">
                    <FaTrash />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleRestore(article.id)} className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200 hover:scale-105">
                    <FaTrashRestore />
                  </button>
                  <button onClick={() => handleForceDelete(article.id)} className="p-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-all duration-200 hover:scale-105">
                    <FaTrashAlt />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <EditPostModal isOpen={!!editPost} onClose={() => setEditPost(null)} post={editPost} />
    </div>
  );
};

export default MyArticlesPage;