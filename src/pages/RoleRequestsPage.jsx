import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { submitRoleRequest, fetchMyRoleRequests } from '../redux/slices/roleRequestsSlice';
import { showSuccess, showError } from '../utils/toastHelpers';
import Button from '../components/Shared/Button';
import Heading from '../components/Shared/Heading';
import { FaUpload, FaFileImage } from 'react-icons/fa';

const ROLE_TYPES = [
  { value: 'rescuer', label: 'roleRequests.rescuer' },
  { value: 'group_admin', label: 'roleRequests.group_admin' },
  { value: 'publisher', label: 'roleRequests.publisher' },
  { value: 'instructor', label: 'roleRequests.instructor' },
  { value: 'seller', label: 'roleRequests.seller' },
  { value: 'provider', label: 'roleRequests.provider' },
];

const RoleRequestsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { requests, submitting, error } = useSelector(state => state.roleRequests);
  const { currentUser, roles } = useSelector(state => state.user);
  const [roleType, setRoleType] = useState('');
  const [metadata, setMetadata] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const isTrusted = roles?.includes('trusted') || currentUser?.roles?.includes('trusted');

  useEffect(() => {
    dispatch(fetchMyRoleRequests());
  }, [dispatch]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showError(t('roleRequests.fileTooLarge'));
      e.target.value = '';
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showError(t('roleRequests.fileTypeInvalid'));
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleType) {
      showError(t('common.fillAllFields'));
      return;
    }
    if (!imageFile) {
      showError(t('roleRequests.uploadRequired'));
      return;
    }

    const formData = new FormData();
    formData.append('role_type', roleType);
    formData.append('submitted_img', imageFile);
    if (metadata.trim()) {
      formData.append('metadata', metadata.trim());
    }

    const result = await dispatch(submitRoleRequest(formData));
    if (submitRoleRequest.fulfilled.match(result)) {
      showSuccess(t('roleRequests.submitSuccess'));
      setRoleType('');
      setMetadata('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      dispatch(fetchMyRoleRequests());
    } else {
      const errMsg = result.payload?.includes('pending request') ? t('roleRequests.duplicateError') : result.payload;
      showError(errMsg);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100';
  };

  return (
    <div className="container my-10 max-w-3xl mx-auto">
      <Heading title={t('roleRequests.title')} subtitle={t('roleRequests.submitNew')} />

      {!isTrusted ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center mb-8 animate-fade-up">
          <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-2">
            {t('roleRequests.trustedRequired')}
          </p>
          <Link to="/trust-verification" className="text-primary underline hover:text-primary/80 transition-colors">
            {t('roleRequests.goToVerification')}
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-8 animate-fade-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('roleRequests.roleType')} *</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                required
              >
                <option value="">-- {t('common.select')} --</option>
                {ROLE_TYPES.map(rt => (
                  <option key={rt.value} value={rt.value}>{t(rt.label)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('roleRequests.docs')} *</label>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary transition-all duration-200 hover:scale-105"
                >
                  <FaUpload className="text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {imageFile ? imageFile.name : t('roleRequests.uploadImage')}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                    <img src={imagePreview} alt={t('roleRequests.preview')} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-200 hover:scale-110"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">{t('roleRequests.imageHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('roleRequests.metadata')}</label>
              <textarea
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                placeholder={t('roleRequests.metadataPlaceholder')}
                rows={2}
                className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>

            <Button type="submit" text={t('roleRequests.submit')} bgColor="bg-primary" textColor="text-white" disabled={submitting || !roleType || !imageFile} />
          </form>
        </div>
      )}

      <Heading title={t('roleRequests.myRequests')} subtitle={t('roleRequests.myRequestsDesc')} />
      {requests.length === 0 ? (
        <p className="text-center text-gray-500 py-6">{t('common.noData')}</p>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const imgUrl = req.submitted_img || req.attachment_url;
            return (
              <div key={req.id} className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-up">
                {imgUrl && (
                  <img src={imgUrl} alt={t('roleRequests.document')} className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-white">{t(`roleRequests.${req.role_type}`)}</p>
                  <p className="text-xs text-gray-500">{t('roleRequests.submittedAt')}: {new Date(req.created_at).toLocaleDateString()}</p>
                  {req.rejection_reason && <p className="text-red-500 text-sm mt-1">{t('roleRequests.rejectionReason')}: {req.rejection_reason}</p>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(req.status)}`}>
                  {t(`roleRequests.${req.status}`)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleRequestsPage;