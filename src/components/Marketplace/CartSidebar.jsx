import { memo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaTrash, FaShoppingCart, FaTimes } from 'react-icons/fa';
import { removeFromCart, clearCart } from '../../redux/slices/marketplaceSlice';
import Button from '../Shared/Button';

const CartItem = memo(({ item, onRemove }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3 border-b border-gray-100 dark:border-gray-700/50 pb-3">
      <img
        src={item.image}
        alt={item.name}
        className="w-14 h-14 object-cover rounded-lg shrink-0"
        width="56"
        height="56"
        loading="lazy"
        decoding="async"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-gray-800 dark:text-white truncate">{item.name}</h4>
        <div className="flex justify-between items-center mt-1">
          <span className="text-primary font-bold text-sm">
            {item.price} {t('marketplace.currency')}
          </span>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-400 hover:text-red-600 transition-colors p-1"
            aria-label={`إزالة ${item.name} من السلة`}
          >
            <FaTrash className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
});
CartItem.displayName = 'CartItem';

const CartSidebar = memo(({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cart = useSelector(state => state.marketplace.userCart);
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const handleRemove = useCallback((id) => dispatch(removeFromCart(id)), [dispatch]);
  const handleClear = useCallback(() => dispatch(clearCart()), [dispatch]);
  const handleCheckout = useCallback(() => alert(t('marketplace.orderPlaced')), [t]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('marketplace.cart')}
    >
      <div
        className="absolute end-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <FaShoppingCart className="text-primary" />
            {t('marketplace.cart')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            aria-label={t('common.close') || 'إغلاق'}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="text-5xl opacity-30">🛒</div>
              <p className="text-gray-400 text-sm">{t('marketplace.emptyCart')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <CartItem key={item.id} item={item} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between font-bold text-base mb-4 text-gray-800 dark:text-white">
              <span>{t('marketplace.total')}</span>
              <span className="text-primary">{total.toFixed(2)} {t('marketplace.currency')}</span>
            </div>
            <div className="flex gap-2">
              <Button
                text={t('marketplace.checkout')}
                bgColor="bg-primary hover:bg-primary/90"
                textColor="text-white"
                handler={handleCheckout}
              />
              <Button
                text={t('marketplace.clearCart')}
                bgColor="bg-red-500 hover:bg-red-600"
                textColor="text-white"
                handler={handleClear}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CartSidebar.displayName = 'CartSidebar';
export default CartSidebar;