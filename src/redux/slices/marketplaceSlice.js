import { createSlice } from '@reduxjs/toolkit';

// بيانات وهمية للمتاجر
const mockStores = [
  {
    id: 'store1',
    name: 'صيدلية السلام',
    ownerName: 'د. أحمد علي',
    logo: 'https://cdn-icons-png.flaticon.com/512/3096/3096182.png',
    location: { lat: 31.2001, lng: 29.9187, address: 'الإسكندرية، محطة الرمل' },
    category: 'صيدلية',
    productsCount: 45,
    rating: 4.7,
    isVerified: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'store2',
    name: 'متجر الأمان الغذائي',
    ownerName: 'محمد رضا',
    logo: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
    location: { lat: 30.0444, lng: 31.2357, address: 'القاهرة، مدينة نصر' },
    category: 'مواد غذائية',
    productsCount: 120,
    rating: 4.5,
    isVerified: true,
    createdAt: '2024-02-10',
  },
  {
    id: 'store3',
    name: 'مستلزمات طوارئ',
    ownerName: 'هند مصطفى',
    logo: 'https://cdn-icons-png.flaticon.com/512/2990/2990502.png',
    location: { lat: 31.2001, lng: 29.9187, address: 'الإسكندرية، سموحة' },
    category: 'مستلزمات طوارئ',
    productsCount: 32,
    rating: 4.9,
    isVerified: true,
    createdAt: '2024-03-05',
  },
  {
    id: 'store4',
    name: 'أجهزة طبية HomeCare',
    ownerName: 'د. سامي يوسف',
    logo: 'https://cdn-icons-png.flaticon.com/512/2103/2103639.png',
    location: { lat: 30.0444, lng: 31.2357, address: 'القاهرة، المعادي' },
    category: 'أجهزة طبية',
    productsCount: 28,
    rating: 4.8,
    isVerified: false,
    createdAt: '2024-04-20',
  },
];

// بيانات وهمية للمنتجات
const mockProducts = {
  store1: [
    { id: 'p1', name: 'أدوية برد', price: 45, image: 'https://placehold.co/200x200/4f46e5/white?text=Cold+Medicine', category: 'أدوية', inStock: true },
    { id: 'p2', name: 'كمامات طبية', price: 25, image: 'https://placehold.co/200x200/10b981/white?text=Masks', category: 'وقاية', inStock: true },
    { id: 'p3', name: 'معقم أيادي', price: 60, image: 'https://placehold.co/200x200/ef4444/white?text=Sanitizer', category: 'تنظيف', inStock: true },
  ],
  store2: [
    { id: 'p4', name: 'طوارئ غذائية (علبة)', price: 150, image: 'https://placehold.co/200x200/f59e0b/white?text=Food+Box', category: 'مواد غذائية', inStock: true },
    { id: 'p5', name: 'مياه شرب (زجاجة 1.5L)', price: 5, image: 'https://placehold.co/200x200/3b82f6/white?text=Water', category: 'مشروبات', inStock: false },
  ],
  store3: [
    { id: 'p6', name: 'طقم إسعافات أولية', price: 200, image: 'https://placehold.co/200x200/8b5cf6/white?text=First+Aid', category: 'إسعافات', inStock: true },
    { id: 'p7', name: 'مصباح يدوي طوارئ', price: 85, image: 'https://placehold.co/200x200/ec4899/white?text=Flashlight', category: 'إضاءة', inStock: true },
  ],
  store4: [
    { id: 'p8', name: 'جهاز قياس ضغط', price: 1200, image: 'https://placehold.co/200x200/14b8a6/white?text=BP+Monitor', category: 'أجهزة', inStock: true },
    { id: 'p9', name: 'سماعة طبية', price: 350, image: 'https://placehold.co/200x200/6366f1/white?text=Stethoscope', category: 'أجهزة', inStock: true },
  ],
};

// طلبات فتح متجر جديد
const mockStoreRequests = [
  {
    id: 'req1',
    userId: 'user456',
    userName: 'خالد حسن',
    storeName: 'متجر الإخلاص',
    category: 'مواد غذائية',
    documents: ['id_card.pdf', 'license.jpg'],
    status: 'pending',
    createdAt: '2025-05-10',
  },
];

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState: {
    stores: mockStores,
    products: mockProducts,
    storeRequests: mockStoreRequests,
    filterCategory: 'all',
    filterLocation: 'all',
    selectedStore: null,
    userCart: [],
    isCartOpen: false,    // <-- تمت الإضافة
    loading: false,
  },
  reducers: {
    addStore: (state, action) => { state.stores.push(action.payload); },
    updateStore: (state, action) => {
      const index = state.stores.findIndex(s => s.id === action.payload.id);
      if (index !== -1) state.stores[index] = action.payload;
    },
    addProduct: (state, action) => {
      const { storeId, product } = action.payload;
      if (!state.products[storeId]) state.products[storeId] = [];
      state.products[storeId].push(product);
      const store = state.stores.find(s => s.id === storeId);
      if (store) store.productsCount += 1;
    },
    removeProduct: (state, action) => {
      const { storeId, productId } = action.payload;
      if (state.products[storeId]) {
        state.products[storeId] = state.products[storeId].filter(p => p.id !== productId);
        const store = state.stores.find(s => s.id === storeId);
        if (store) store.productsCount -= 1;
      }
    },
    addStoreRequest: (state, action) => { state.storeRequests.unshift(action.payload); },
    updateStoreRequestStatus: (state, action) => {
      const { id, status } = action.payload;
      const req = state.storeRequests.find(r => r.id === id);
      if (req) req.status = status;
    },
    setFilterCategory: (state, action) => { state.filterCategory = action.payload; },
    setFilterLocation: (state, action) => { state.filterLocation = action.payload; },
    setSelectedStore: (state, action) => { state.selectedStore = action.payload; },
    addToCart: (state, action) => { state.userCart.push(action.payload); },
    removeFromCart: (state, action) => { state.userCart = state.userCart.filter(i => i.id !== action.payload); },
    clearCart: (state) => { state.userCart = []; },

    // إضافة الـ reducers الخاصة بالسلة الجانبية
    toggleCart: (state) => { state.isCartOpen = !state.isCartOpen; },
    openCart: (state) => { state.isCartOpen = true; },
    closeCart: (state) => { state.isCartOpen = false; },
  },
});

export const {
  addStore, updateStore, addProduct, removeProduct,
  addStoreRequest, updateStoreRequestStatus,
  setFilterCategory, setFilterLocation, setSelectedStore,
  addToCart, removeFromCart, clearCart,
  toggleCart, openCart, closeCart,
} = marketplaceSlice.actions;

export default marketplaceSlice.reducer;