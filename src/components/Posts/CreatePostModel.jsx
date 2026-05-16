import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { addPost } from '../../redux/slices/postsSlice';
import { FaTimes, FaImage, FaCheckCircle } from 'react-icons/fa';
import Button from '../Shared/Button';

// ✅ التحسين: Toast بسيط بدل alert()
const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl animate-fade-in">
    <FaCheckCircle className="text-green-400 text-xl" />
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="text-gray-400 hover:text-white ml-2">
      <FaTimes />
    </button>
  </div>
);

const CreatePostModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('نصائح');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ التحسين: معاينة الصورة قبل الرفع
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setCategory('نصائح');
    setImage(null);
    setImagePreview(null);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);

    const isPublisher = currentUser?.roles?.includes('publisher');

    const newPost = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      category,
      // ✅ التحسين: avatar من بيانات المستخدم الفعلية، وليس Math.random()
      author: {
        id: currentUser?.id || 'user_temp',
        name: currentUser?.name || 'مستخدم جديد',
        avatar: currentUser?.avatar || null,
        role: isPublisher ? 'publisher' : 'user',
      },
      coverImage: imagePreview || null,
      likes: 0,
      dislikes: 0,
      comments: [],
      views: 0,
      publishedAt: new Date().toISOString(),
      isLikedByUser: false,
      isDislikedByUser: false,
      status: isPublisher ? 'published' : 'pending',
    };

    dispatch(addPost(newPost));
    setIsSubmitting(false);
    resetForm();
    onClose();

    // ✅ التحسين: Toast بدل alert()
    showToast(
      t('posts.postSubmitted', {
        status: isPublisher ? t('posts.published') : t('posts.pending'),
      })
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('posts.createPost')}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={t('common.close')}
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* العنوان */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('posts.title')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder={t('posts.titlePlaceholder')}
                required
                maxLength={120}
              />
              <p className="text-xs text-gray-400 mt-1 text-left">{title.length}/120</p>
            </div>

            {/* التصنيف */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('posts.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              >
                <option value="نصائح">💡 نصائح</option>
                <option value="إسعافات">🚑 إسعافات</option>
                <option value="سلامة">🛡️ سلامة</option>
                <option value="تعليمي">📚 تعليمي</option>
              </select>
            </div>

            {/* المحتوى */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('posts.content')}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="7"
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none"
                placeholder={t('posts.contentPlaceholder')}
                required
              />
            </div>

            {/* رفع الصورة مع معاينة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaImage className="inline mr-2" /> {t('posts.image')}
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer text-gray-500 hover:text-primary transition-colors">
                  {image ? image.name : t('posts.clickToUpload')}
                </label>
              </div>

              {/* ✅ التحسين: معاينة الصورة */}
              {imagePreview && (
                <div className="relative mt-3">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              )}
            </div>

            {/* أزرار */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                text={t('common.cancel')}
                bgColor="bg-gray-100 dark:bg-gray-700"
                textColor="text-gray-700 dark:text-gray-200"
                handler={handleClose}
              />
              <Button
                text={isSubmitting ? '...' : t('posts.publish')}
                bgColor="bg-primary"
                textColor="text-white"
                disabled={isSubmitting}
              />
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
};

export default CreatePostModal;
