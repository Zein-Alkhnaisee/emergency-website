import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { FaTimes, FaImage, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { updatePost, fetchMyArticles } from '../../redux/slices/postsSlice';

const EditPostModal = ({ isOpen, onClose, post }) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setCoverImageFile(null);
      setPreviewUrl(post.cover_image || null);
      setError(null);
      setSuccess(false);
    }
  }, [post, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(updatePost({
        articleId: post.id,
        title: title.trim(),
        content: content.trim(),
        coverImageFile
      })).unwrap();
      setSuccess(true);
      setTimeout(() => {
        dispatch(fetchMyArticles({}));
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">تعديل المقال</h3>
          <button onClick={handleClose} disabled={submitting} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <FaCheckCircle className="text-green-500 text-5xl" />
            <p className="text-gray-700 dark:text-gray-200 font-medium">تم التعديل، المقال الآن قيد المراجعة مرة أخرى.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && <div className="bg-red-50 p-3 rounded-xl text-red-600 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1.5">العنوان *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">المحتوى *</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} required className="w-full px-4 py-2.5 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">صورة الغلاف (اختياري)</label>
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                  <button type="button" onClick={() => { setCoverImageFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current.click()} className="w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center">
                  <FaImage className="text-2xl" /> رفع صورة
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={handleClose} disabled={submitting} className="px-5 py-2.5 rounded-xl bg-gray-100">إلغاء</button>
              <button type="submit" disabled={submitting || !title.trim() || !content.trim()} className="px-6 py-2.5 rounded-xl bg-primary text-white flex items-center gap-2">
                {submitting && <FaSpinner className="animate-spin" />} حفظ التعديلات
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditPostModal;