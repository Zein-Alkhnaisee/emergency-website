import { useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaCartPlus, FaMinusCircle } from 'react-icons/fa';
import { addToCart, removeFromCart } from '../../redux/slices/marketplaceSlice';

// Targeted selector — avoids re-render when other cart items change
const makeIsInCartSelector = (productId) => (state) =>
  state.marketplace.userCart.some(item => item.id === productId);

const ProductCard = memo(({ product, storeId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isInCart = useSelector(makeIsInCartSelector(product.id));

  const handleAdd = useCallback(() => {
    if (!product.inStock) return;
    dispatch(addToCart({ ...product, storeId, quantity: 1 }));
  }, [dispatch, product, storeId]);

  const handleRemove = useCallback(() => {
    dispatch(removeFromCart(product.id));
  }, [dispatch, product.id]);

  return (
    <article
      data-aos="zoom-in"
      data-aos-duration="400"
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700/50"
    >
      <div className="relative h-36 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              {t('marketplace.outOfStock')}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-1 mb-2">
          {product.name}
        </h4>
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-primary)] font-bold text-sm">
            {product.price} {t('marketplace.currency')}
          </span>
          {isInCart ? (
            <button
              onClick={handleRemove}
              className="text-red-400 hover:text-red-600 transition-colors p-1"
              aria-label={`إزالة ${product.name} من السلة`}
            >
              <FaMinusCircle className="text-xl" />
            </button>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!product.inStock}
              className={`transition-colors p-1 ${
                product.inStock
                  ? 'text-[var(--color-primary)] hover:text-[var(--color-primary)]/70'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label={`إضافة ${product.name} إلى السلة`}
              aria-disabled={!product.inStock}
            >
              <FaCartPlus className="text-xl" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;