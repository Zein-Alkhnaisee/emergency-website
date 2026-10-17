// src/pages/TrustVerificationPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchMyVerification,
  submitVerification,
  updateVerification,
  deleteVerification,
  clearTrustError,
} from '../redux/slices/trustSlice';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import Button from '../components/Shared/Button';
import Heading from '../components/Shared/Heading';
import { FaTrash, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const TrustVerificationPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { verification, status, error } = useSelector((state) => state.trust);
  const { roles, currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const isRTL = i18n.language === 'ar';

  const isTrusted = roles?.includes('trusted') || currentUser?.role === 'trusted';
  const isApprovedByApi = verification?.status === 'approved';
  const isApproved = isTrusted || isApprovedByApi;

  const [form, setForm] = useState({
    national_id: '',
    verification_birth_date: '',
    id_card_front: null,
    id_card_back: null,
    verification_photo: null,
    holding_id_photo: null,
  });

  const [previews, setPreviews] = useState({
    id_card_front: null,
    id_card_back: null,
    verification_photo: null,
    holding_id_photo: null,
  });

  useEffect(() => {
    if (!isTrusted) {
      dispatch(fetchMyVerification());
    }
  }, [dispatch, isTrusted]);

  useEffect(() => {
    if (verification) {
      setForm((prev) => ({
        ...prev,
        national_id: verification.national_id || '',
        verification_birth_date: verification.verification_birth_date || '',
      }));
    }
  }, [verification]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearTrustError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, [field]: file }));
    setPreviews((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('national_id', form.national_id);
    formData.append('verification_birth_date', form.verification_birth_date);
    if (form.id_card_front) formData.append('id_card_front', form.id_card_front);
    if (form.id_card_back) formData.append('id_card_back', form.id_card_back);
    if (form.verification_photo) formData.append('verification_photo', form.verification_photo);
    if (form.holding_id_photo) formData.append('holding_id_photo', form.holding_id_photo);

    let result;
    if (verification && verification.status !== 'approved') {
      formData.append('_method', 'PUT');
      result = await dispatch(updateVerification(formData));
    } else {
      result = await dispatch(submitVerification(formData));
    }

    setLoading(false);
    if (submitVerification.fulfilled.match(result) || updateVerification.fulfilled.match(result)) {
      showSuccess(t('trust.submitSuccess'));
      dispatch(fetchMyVerification());
    } else if (submitVerification.rejected.match(result) || updateVerification.rejected.match(result)) {
      showError(result.payload || t('trust.submitError'));
    }
  };

  const handleDelete = async () => {
    confirmToast(t('trust.confirmDelete'), async () => {
      const result = await dispatch(deleteVerification());
      if (deleteVerification.fulfilled.match(result)) {
        showSuccess(t('trust.deleteSuccess'));
        dispatch(fetchMyVerification());
      } else {
        showError(result.payload);
      }
    });
  };

  const renderStatusBadge = () => {
    if (!verification) return null;
    const statusMap = {
      pending: { icon: <FaClock />, label: t('trust.pending'), className: 'bg-yellow-500' },
      approved: { icon: <FaCheckCircle />, label: t('trust.approved'), className: 'bg-green-500' },
      rejected: { icon: <FaTimesCircle />, label: t('trust.rejected'), className: 'bg-red-500' },
    };
    const s = statusMap[verification.status];
    if (!s) return null;
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-md ${s.className}`}>
        {s.icon} {s.label}
      </div>
    );
  };

  // ✅ شرط التمكين: نفعل الحقول إذا لم يكن هناك طلب (إنشاء) أو إذا كان الطلب pending/rejected (تحديث)
  const canEdit = !verification || (verification.status === 'pending' || verification.status === 'rejected');

  if (isApproved) {
    return (
      <div className="container max-w-3xl mx-auto my-10 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Heading title={t('trust.title')} subtitle={t('trust.subtitle')} />
        <div className="text-center py-10 animate-fade-up">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t('trust.alreadyVerified')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('trust.verifiedMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto my-10 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Heading title={t('trust.title')} subtitle={t('trust.subtitle')} />

      {error && status === 'failed' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 animate-fade-up">
          {error}
        </div>
      )}

      {verification && (
        <div className="flex flex-wrap items-center justify-between bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-xl mb-6 animate-fade-up">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('trust.requestStatus')}</span>
            <div className="mt-1">{renderStatusBadge()}</div>
          </div>
          {canEdit && verification && verification.status !== 'approved' && (
            <div className="flex gap-2">
              <Button text={t('trust.delete')} bgColor="bg-red-500" textColor="text-white" handler={handleDelete} icon={<FaTrash />} />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 space-y-5 border border-gray-100 dark:border-gray-700 animate-fade-up">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('trust.nationalId')}</label>
            <input
              type="text"
              value={form.national_id}
              onChange={(e) => setForm({ ...form, national_id: e.target.value })}
              className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('trust.birthDate')}</label>
            <input
              type="date"
              dir="ltr"
              value={form.verification_birth_date}
              onChange={(e) => setForm({ ...form, verification_birth_date: e.target.value })}
              className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {['id_card_front', 'id_card_back', 'verification_photo', 'holding_id_photo'].map((field) => (
            <div key={field} className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-4 text-center hover:border-primary/50 transition-all duration-200">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(`trust.${field}`)}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, field)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                // ✅ الشرط المعدل: يمكن التعديل إذا لم يكن هناك طلب أو كان الطلب pending/rejected
                disabled={!canEdit}
              />
              {previews[field] && (
                <img src={previews[field]} alt={field} className="mt-2 max-h-32 mx-auto rounded-lg object-cover shadow-sm" />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            text={loading ? t('common.loading') : (verification ? t('trust.update') : t('trust.submit'))}
            bgColor="bg-primary"
            textColor="text-white"
            disabled={loading}
          />
        </div>
      </form>

      {!verification && status !== 'loading' && !error && (
        <div className="text-center py-6 text-gray-400 animate-fade-up">
          {t('trust.noRequest')}
        </div>
      )}
    </div>
  );
};

export default TrustVerificationPage;