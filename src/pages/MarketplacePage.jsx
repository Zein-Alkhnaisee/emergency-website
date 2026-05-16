import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Heading from '../components/Shared/Heading';
import StoreCard from '../components/Marketplace/StoreCard';
import ProductCard from '../components/Marketplace/ProductCard';
import MarketplaceFilters from '../components/Marketplace/MarketplaceFilters';
import CartSidebar from '../components/Marketplace/CartSidebar';
import Button from '../components/Shared/Button';
import { setSelectedStore, closeCart } from '../redux/slices/marketplaceSlice';
import { FaStore, FaLocationArrow } from 'react-icons/fa';

// دالة حساب المسافة بين نقطتين (Haversine formula)
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // نصف قطر الأرض بالكيلومترات
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MarketplacePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { stores: originalStores, products, filterCategory, filterLocation, selectedStore, userCart, isCartOpen } = useSelector(state => state.marketplace);
  const { currentUser } = useSelector(state => state.user);
  const [filteredStores, setFilteredStores] = useState([]);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [maxDistance, setMaxDistance] = useState(500);
  const [stores, setStores] = useState([]);

  // 1. جلب موقع المستخدم (مع تخزين في localStorage)
  useEffect(() => {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      setUserLocation(JSON.parse(saved));
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          localStorage.setItem('userLocation', JSON.stringify(loc));
        },
        (err) => {
          console.error(err);
          setLocationError(t('marketplace.locationDenied'));
          // موقع افتراضي وسط القاهرة لتجنب تعطل التصفية
          const defaultLoc = { lat: 30.0444, lng: 31.2357 };
          setUserLocation(defaultLoc);
        }
      );
    } else {
      setLocationError(t('marketplace.geoNotSupported'));
      const defaultLoc = { lat: 30.0444, lng: 31.2357 };
      setUserLocation(defaultLoc);
    }
  }, [t]);

  // 2. إضافة متجر تجريبي قريب جداً من موقع المستخدم (للتأكد من وجود متاجر أثناء التطوير)
  useEffect(() => {
    if (!userLocation) return;
    const demoStore = {
      id: 'demo_nearby',
      name: '🚑 نقطة إسعاف مجتمعي (تجريبي)',
      ownerName: 'الهلال الأحمر',
      logo: 'https://cdn-icons-png.flaticon.com/512/2990/2990502.png',
      location: { lat: userLocation.lat, lng: userLocation.lng, address: 'موقعك الحالي (تجريبي - قريب منك)' },
      category: 'مستلزمات طوارئ',
      productsCount: 8,
      rating: 5.0,
      isVerified: true,
    };
    const hasDemo = originalStores.some(s => s.id === 'demo_nearby');
    setStores(hasDemo ? originalStores : [demoStore, ...originalStores]);
  }, [userLocation, originalStores]);

  // 3. تصفية وترتيب المتاجر حسب الموقع والمسافة والفلاتر
  useEffect(() => {
    if (!userLocation || stores.length === 0) return;
    let result = stores.map(store => ({
      ...store,
      distance: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, store.location.lat, store.location.lng)
    }));
    if (filterCategory !== 'الكل') {
      result = result.filter(store => store.category === filterCategory);
    }
    if (filterLocation !== 'الكل') {
      result = result.filter(store => store.location.address.includes(filterLocation));
    }
    if (maxDistance > 0) {
      result = result.filter(store => store.distance <= maxDistance);
    }
    result.sort((a, b) => a.distance - b.distance);
    setFilteredStores(result);
  }, [stores, userLocation, filterCategory, filterLocation, maxDistance]);

  if (locationError) {
    return (
      <div className="container my-10 text-center">
        <p className="text-red-500">{locationError}</p>
        <button onClick={() => window.location.reload()} className="text-primary underline mt-2">{t('marketplace.retryLocation')}</button>
      </div>
    );
  }

  if (!userLocation) {
    return <div className="container my-10 text-center animate-pulse">📍 {t('marketplace.locating')}</div>;
  }

  const currentStoreProducts = selectedStore ? (products[selectedStore] || []) : [];

  return (
    <div id="marketplace" className="container my-10 scroll-mt-20">
      <Heading title={t('marketplace.title')} subtitle={t('marketplace.subtitle')} />

      {/* طلب فتح متجر (للمستخدم العادي) */}
      {currentUser && (
        <div className="flex justify-end mb-6">
          <Button
            text={t('marketplace.openStore')}
            bgColor="bg-secondary"
            textColor="text-white"
            icon={<FaStore className="mr-2" />}
            handler={() => setShowStoreForm(true)}
          />
        </div>
      )}

      {/* شريط التحكم بالمسافة */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-sm">
          <FaLocationArrow className="text-primary" />
          <span>{t('marketplace.showingNearby', { radius: maxDistance })}</span>
          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="px-2 py-1 rounded border dark:bg-gray-700"
          >
            <option value={5}>5 {t('marketplace.km')}</option>
            <option value={10}>10 {t('marketplace.km')}</option>
            <option value={20}>20 {t('marketplace.km')}</option>
            <option value={50}>50 {t('marketplace.km')}</option>
            <option value={500}>500 {t('marketplace.km')}</option>
            <option value={0}>{t('marketplace.allStores')}</option>
          </select>
        </div>
        <div className="text-xs text-gray-500">
          📍 {t('marketplace.yourLocation')}: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </div>
      </div>

      <MarketplaceFilters />

      {!selectedStore ? (
        filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('marketplace.noStoresNearby', { radius: maxDistance })}</p>
            <button
              onClick={() => setMaxDistance(500)}
              className="text-primary underline mt-2"
            >
              {t('marketplace.increaseRadius')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store, idx) => (
              <StoreCard key={store.id} store={store} index={idx} />
            ))}
          </div>
        )
      ) : (
        <div>
          <button
            onClick={() => dispatch(setSelectedStore(null))}
            className="mb-4 text-primary hover:underline"
          >
            &larr; {t('marketplace.backToStores')}
          </button>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentStoreProducts.map(product => (
              <ProductCard key={product.id} product={product} storeId={selectedStore} />
            ))}
          </div>
        </div>
      )}

      {/* السلة الجانبية - تستخدم isCartOpen من Redux و closeCart */}
      <CartSidebar isOpen={isCartOpen} onClose={() => dispatch(closeCart())} />

      {/* مودال طلب فتح متجر */}
      {showStoreForm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowStoreForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">{t('marketplace.requestStore')}</h3>
            <input
              type="text"
              placeholder={t('marketplace.storeName')}
              className="w-full p-2 border rounded mb-3 dark:bg-gray-700"
            />
            <select className="w-full p-2 border rounded mb-3 dark:bg-gray-700">
              <option>{t('marketplace.category')}</option>
              <option>{t('marketplace.catPharmacy')}</option>
              <option>{t('marketplace.catFood')}</option>
              <option>{t('marketplace.catEmergency')}</option>
              <option>{t('marketplace.catMedical')}</option>
            </select>
            <div className="flex gap-3 justify-end">
              <Button
                text={t('common.cancel')}
                bgColor="bg-gray-500"
                textColor="text-white"
                handler={() => setShowStoreForm(false)}
              />
              <Button
                text={t('marketplace.submit')}
                bgColor="bg-primary"
                textColor="text-white"
                handler={() => {
                  alert(t('marketplace.requestSent'));
                  setShowStoreForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;