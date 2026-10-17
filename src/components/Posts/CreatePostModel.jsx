import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaImage, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { createPost } from '../../redux/slices/postsSlice';
import { fetchPosts } from '../../redux/slices/postsSlice';

const CreatePostModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { submitting, error } = useSelector(s => s.posts);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      await dispatch(createPost({ title: title.trim(), content: content.trim(), coverImageFile })).unwrap();
      setSuccess(true);
      setTimeout(() => {
        dispatch(fetchPosts({ page: 1, perPage: 10 }));
        handleClose();
      }, 1500);
    } catch {
      // error handled by redux
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setTitle('');
    setContent('');
    setCoverImageFile(null);
    setPreviewUrl(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 dark:border-gray-700/50 animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {t('posts.createPost')}
          </h3>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 hover:rotate-90 disabled:opacity-40"
          >
            <FaTimes />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <FaCheckCircle className="text-green-500 text-5xl animate-bounce" />
            <p className="text-gray-700 dark:text-gray-200 font-medium text-lg text-center">
              {t('posts.postSubmitted', { status: t('posts.pending') })}
            </p>
            <p className="text-sm text-gray-400 text-center">
              {t('posts.pendingReview')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 animate-fade-up">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('posts.titlePlaceholder').replace('...', '')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('posts.titlePlaceholder')}
                maxLength={255}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-400 mt-1 text-end">{title.length}/255</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('posts.contentPlaceholder').replace('...', '')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={t('posts.contentPlaceholder')}
                rows={6}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('posts.image')} <span className="text-gray-400 text-xs">{t('posts.imageOptional')}</span>
              </label>

              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={previewUrl}
                    alt={t('posts.preview')}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => { setCoverImageFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/70 transition-all duration-200 hover:scale-110"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
                >
                  <FaImage className="text-2xl" />
                  <span className="text-sm">{t('posts.clickToUpload')}</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-40"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <FaSpinner className="animate-spin text-xs" />}
                {submitting ? t('posts.publishing') : t('posts.publish')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;