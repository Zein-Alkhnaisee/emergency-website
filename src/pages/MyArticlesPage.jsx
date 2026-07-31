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
        <h1 className="text-2xl font-bold">{t('posts.myArticles')}</h1>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
        >
          <FaArrowRight /> {t('posts.backToPosts')}
        </button>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {[
          { key: 'published', label: t('posts.published') },
          { key: 'pending', label: t('posts.pending') },
          { key: 'rejected', label: t('posts.rejected') },
          { key: 'trash', label: t('posts.trashBin') }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-5 py-2 text-sm font-medium transition ${
              tab === item.key ? 'border-b-2 border-primary text-primary' : 'text-gray-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-10">{t('common.loading')}</div>}
      {!loading && articles?.length === 0 && (
        <p className="text-center text-gray-500 py-10">{t('posts.noArticles')}</p>
      )}
      <div className="space-y-3">
        {articles?.map(article => (
          <div key={article.id} className="border rounded-xl p-4 flex justify-between items-center bg-white dark:bg-gray-800">
            <div>
              <Link to={`/posts/${article.id}`} className="font-semibold hover:text-primary">
                {article.title}
              </Link>
              <div className="text-xs text-gray-400 mt-1">
                {t('posts.status')}: {article.status === 'approved' ? t('posts.published') : article.status === 'pending' ? t('posts.pending') : t('posts.rejected')}
              </div>
            </div>
            <div className="flex gap-2">
              {tab !== 'trash' ? (
                <>
                  <button onClick={() => setEditPost(article)} className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleSoftDelete(article.id)} className="p-2 bg-red-100 rounded-lg text-red-600">
                    <FaTrash />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleRestore(article.id)} className="p-2 bg-green-100 rounded-lg text-green-600">
                    <FaTrashRestore />
                  </button>
                  <button onClick={() => handleForceDelete(article.id)} className="p-2 bg-red-700 text-white rounded-lg">
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