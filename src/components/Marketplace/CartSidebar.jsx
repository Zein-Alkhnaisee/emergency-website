import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaTrash, FaShoppingCart, FaTimes } from 'react-icons/fa';
import { removeFromCart, clearCart } from '../../redux/slices/marketplaceSlice';
import Button from '../Shared/Button';

const CartSidebar = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const cart = useSelector(state => state.marketplace.userCart);
    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><FaShoppingCart /> {t('marketplace.cart')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
                </div>
                {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">{t('marketplace.emptyCart')}</p>
                ) : (
                    <>
                        <div className="space-y-4 mb-6">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                    <div className="flex-1">
                                        <h4 className="font-medium">{item.name}</h4>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-primary font-bold">{item.price} {t('marketplace.currency')}</span>
                                            <button onClick={() => dispatch(removeFromCart(item.id))} className="text-red-500"><FaTrash /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4">
                            <div className="flex justify-between font-bold text-lg mb-4">
                                <span>{t('marketplace.total')}</span>
                                <span>{total} {t('marketplace.currency')}</span>
                            </div>
                            <div className="flex gap-3">
                                <Button text={t('marketplace.checkout')} bgColor="bg-primary" textColor="text-white" handler={() => alert(t('marketplace.orderPlaced'))} />
                                <Button text={t('marketplace.clearCart')} bgColor="bg-red-500" textColor="text-white" handler={() => dispatch(clearCart())} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CartSidebar;