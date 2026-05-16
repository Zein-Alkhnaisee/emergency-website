import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaCartPlus, FaCheckCircle, FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import { addToCart, removeFromCart } from '../../redux/slices/marketplaceSlice';
import Button from '../Shared/Button';

const ProductCard = ({ product, storeId }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const cart = useSelector(state => state.marketplace.userCart);
    const [quantity, setQuantity] = useState(1);
    const isInCart = cart.some(item => item.id === product.id);

    const handleAddToCart = () => {
        if (!product.inStock) return;
        dispatch(addToCart({ ...product, storeId, quantity }));
        alert(t('marketplace.addedToCart'));
    };

    const handleRemoveFromCart = () => {
        dispatch(removeFromCart(product.id));
    };

    return (
        <div
            data-aos="zoom-in"
            data-aos-duration="500"
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
            <div className="relative h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                <img src={product.image} alt={product.name} className="h-full object-cover transition-transform group-hover:scale-110" />
                {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">{t('marketplace.outOfStock')}</span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white line-clamp-1">{product.name}</h4>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-primary font-bold text-lg">{product.price} {t('marketplace.currency')}</span>
                    {isInCart ? (
                        <button onClick={handleRemoveFromCart} className="text-red-500 hover:text-red-600 transition">
                            <FaMinusCircle className="text-2xl" />
                        </button>
                    ) : (
                        <button onClick={handleAddToCart} disabled={!product.inStock} className={`text-primary hover:text-primary/70 transition ${!product.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <FaCartPlus className="text-2xl" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;