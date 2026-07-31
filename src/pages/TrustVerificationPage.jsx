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
  const [loading, setLoading] = useState(false);
  const isRTL = i18n.language === 'ar';

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
    dispatch(fetchMyVerification());
  }, [dispatch]);

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
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white ${s.className}`}>
        {s.icon} {s.label}
      </div>
    );
  };

  const canEdit = verification && (verification.status === 'pending' || verification.status === 'rejected');
  const isApproved = verification?.status === 'approved';

  return (
    <div className="container max-w-3xl mx-auto my-10 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Heading title={t('trust.title')} subtitle={t('trust.subtitle')} />

      {error && status === 'failed' && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>
      )}

      {verification && (
        <div className="flex flex-wrap items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6">
          <div>
            <span className="text-sm text-gray-500">{t('trust.requestStatus')}</span>
            <div className="mt-1">{renderStatusBadge()}</div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button text={t('trust.delete')} bgColor="bg-red-500" textColor="text-white" handler={handleDelete} icon={<FaTrash />} />
            </div>
          )}
        </div>
      )}

      {!isApproved && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('trust.nationalId')}</label>
              <input
                type="text"
                value={form.national_id}
                onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                className="w-full p-2 border rounded-lg dark:bg-gray-700"
                required
                disabled={isApproved}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('trust.birthDate')}</label>
              <input
                type="date"
                dir="ltr"
                value={form.verification_birth_date}
                onChange={(e) => setForm({ ...form, verification_birth_date: e.target.value })}
                className="w-full p-2 border rounded-lg dark:bg-gray-700"
                required
                disabled={isApproved}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {['id_card_front', 'id_card_back', 'verification_photo', 'holding_id_photo'].map((field) => (
              <div key={field} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <label className="block text-sm font-medium mb-2">{t(`trust.${field}`)}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, field)}
                  className="w-full text-sm"
                  disabled={isApproved || (!canEdit && verification)}
                />
                {previews[field] && (
                  <img src={previews[field]} alt={field} className="mt-2 max-h-32 mx-auto rounded object-cover" />
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
              disabled={loading || isApproved}
            />
          </div>
        </form>
      )}

      {isApproved && (
        <div className="text-center py-10">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold">{t('trust.alreadyVerified')}</h3>
          <p className="text-gray-500">{t('trust.verifiedMessage')}</p>
        </div>
      )}

      {!verification && status !== 'loading' && !error && (
        <div className="text-center py-6 text-gray-400">
          {t('trust.noRequest')}
        </div>
      )}
    </div>
  );
};

export default TrustVerificationPage;