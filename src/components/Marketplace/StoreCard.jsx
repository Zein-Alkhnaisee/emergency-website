import { useCallback, memo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt, FaStar, FaBoxes, FaCheckCircle, FaLocationArrow } from 'react-icons/fa';
import { setSelectedStore } from '../../redux/slices/marketplaceSlice';
import Button from '../Shared/Button';

const StoreCard = memo(({ store, index }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleSelect = useCallback(() => {
    dispatch(setSelectedStore(store.id));
  }, [dispatch, store.id]);

  return (
    <article
      data-aos="fade-up"
      data-aos-delay={Math.min(index * 70, 350)}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100 dark:border-gray-700/50"
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Logo — explicit size prevents CLS */}
          <div className="w-14 h-14 shrink-0 rounded-xl bg-gray-50 dark:bg-gray-700 p-2 flex items-center justify-center overflow-hidden"
            style={{ aspectRatio: '1/1' }}>
            <img
              src={store.logo}
              alt={`شعار ${store.name}`}
              width={48}
              height={48}
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-bold text-gray-800 dark:text-white group-hover:text-[var(--color-primary)] transition truncate">
                {store.name}
              </h3>
              {store.isVerified && (
                <FaCheckCircle
                  className="text-green-500 text-sm shrink-0"
                  aria-label={t('marketplace.verified')}
                />
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <FaStar className="text-yellow-400" aria-hidden="true" />
                <span aria-label={`تقييم ${store.rating}`}>{store.rating}</span>
              </span>
              <span className="flex items-center gap-1">
                <FaBoxes className="text-[var(--color-primary)]/60" aria-hidden="true" />
                {store.productsCount} {t('marketplace.products')}
              </span>
            </div>

            <p className="flex items-center gap-1 text-xs text-gray-500 mt-1 truncate">
              <FaMapMarkerAlt className="text-[var(--color-primary)]/70 shrink-0" aria-hidden="true" />
              {store.location.address}
            </p>

            {store.distance !== undefined && (
              <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                <FaLocationArrow className="text-[10px]" aria-hidden="true" />
                {store.distance.toFixed(1)} {t('marketplace.km')} {t('marketplace.away')}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full">
            {store.category}
          </span>
          <Button
            text={t('marketplace.viewStore')}
            bgColor="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
            textColor="text-white"
            handler={handleSelect}
            ariaLabel={`عرض متجر ${store.name}`}
            className="shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40"
          />
        </div>
      </div>
    </article>
  );
});

StoreCard.displayName = 'StoreCard';
export default StoreCard;