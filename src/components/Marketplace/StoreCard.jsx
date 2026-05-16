import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaStore, FaMapMarkerAlt, FaStar, FaBoxes, FaCheckCircle, FaLocationArrow } from 'react-icons/fa';
import { setSelectedStore } from '../../redux/slices/marketplaceSlice';
import Button from '../Shared/Button';

const StoreCard = ({ store, index }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleSelectStore = () => {
    dispatch(setSelectedStore(store.id));
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 80}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-xl object-contain bg-gray-50 dark:bg-gray-700 p-2" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-primary transition">{store.name}</h3>
              {store.isVerified && <FaCheckCircle className="text-green-500" title={t('marketplace.verified')} />}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1"><FaStar className="text-yellow-400" /> {store.rating}</span>
              <span className="flex items-center gap-1"><FaBoxes /> {store.productsCount} {t('marketplace.products')}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <FaMapMarkerAlt className="text-primary" />
              <span>{store.location.address}</span>
            </div>
            {/* عرض المسافة إذا كانت موجودة */}
            {store.distance !== undefined && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                <FaLocationArrow className="text-xs" />
                <span>{store.distance.toFixed(1)} {t('marketplace.km')} {t('marketplace.away')}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">{store.category}</span>
          <Button text={t('marketplace.viewStore')} bgColor="bg-primary" textColor="text-white" handler={handleSelectStore} />
        </div>
      </div>
    </div>
  );
};

export default StoreCard;