import { createSlice } from '@reduxjs/toolkit';

// بيانات وهمية للمنشورات
const mockPosts = [
  {
    id: '1',
    title: 'كيف تتصرف في حالة حريق المنزل؟',
    content: 'عند نشوب حريق، حافظ على هدوئك وأخلِ المبنى فوراً. استخدم طفاية الحريق إذا كان الحريق صغيراً. اتصل بالدفاع المدني فوراً...',
    author: {
      id: 'user1',
      name: 'أحمد السيد',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      role: 'publisher',
    },
    category: 'نصائح',
    likes: 245,
    dislikes: 12,
    comments: 34,
    views: 1250,
    publishedAt: '2025-05-01T10:30:00Z',
    isLikedByUser: false,
    isDislikedByUser: false,
  },
  {
    id: '2',
    title: 'الإسعافات الأولية للحروق',
    content: 'ضع المنطقة المصابة تحت ماء بارد جارٍ لمدة 15-20 دقيقة. لا تستخدم الثلج مباشرة على الحرق. غط الحرق بضمادة معقمة...',
    author: {
      id: 'user2',
      name: 'سارة خالد',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      role: 'user',
    },
    category: 'إسعافات',
    likes: 189,
    dislikes: 5,
    comments: 28,
    views: 890,
    publishedAt: '2025-04-28T14:20:00Z',
    isLikedByUser: false,
    isDislikedByUser: false,
  },
  {
    id: '3',
    title: 'كيف تحمي عائلتك من الغرق؟',
    content: 'تعليم الأطفال السباحة، الإشراك الدائم عليهم بالقرب من المسابح، تركيب حواجز أمان، تعلم الإنعاش القلبي الرئوي...',
    author: {
      id: 'user3',
      name: 'محمد رضا',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      role: 'publisher',
    },
    category: 'سلامة',
    likes: 320,
    dislikes: 8,
    comments: 45,
    views: 2100,
    publishedAt: '2025-04-25T09:15:00Z',
    isLikedByUser: false,
    isDislikedByUser: false,
  },
];

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: mockPosts,
    pendingPosts: [], // منشورات تنتظر الموافقة
    loading: false,
    filter: 'all', // all, trending, mostLiked, mostCommented
    category: 'all',
  },
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    addPost: (state, action) => {
      if (action.payload.role === 'publisher') {
        state.posts.unshift(action.payload);
      } else {
        state.pendingPosts.unshift(action.payload);
      }
    },
    approvePost: (state, action) => {
      const approvedPost = state.pendingPosts.find(p => p.id === action.payload);
      if (approvedPost) {
        approvedPost.status = 'approved';
        state.posts.unshift(approvedPost);
        state.pendingPosts = state.pendingPosts.filter(p => p.id !== action.payload);
      }
    },
    rejectPost: (state, action) => {
      state.pendingPosts = state.pendingPosts.filter(p => p.id !== action.payload);
    },
    toggleLike: (state, action) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) {
        if (post.isLikedByUser) {
          post.likes--;
          post.isLikedByUser = false;
        } else {
          post.likes++;
          post.isLikedByUser = true;
          // إذا كان المستخدم قد أعطى dislike، نزيله
          if (post.isDislikedByUser) {
            post.dislikes--;
            post.isDislikedByUser = false;
          }
        }
      }
    },
    toggleDislike: (state, action) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) {
        if (post.isDislikedByUser) {
          post.dislikes--;
          post.isDislikedByUser = false;
        } else {
          post.dislikes++;
          post.isDislikedByUser = true;
          if (post.isLikedByUser) {
            post.likes--;
            post.isLikedByUser = false;
          }
        }
      }
    },
    addComment: (state, action) => {
      const { postId, comment } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        post.comments.push(comment);
      }
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setCategory: (state, action) => {
      state.category = action.payload;
    },
  },
});
export const {
  setPosts,
  addPost,
  approvePost,
  rejectPost,
  toggleLike,
  toggleDislike,
  addComment,
  setFilter,
  setCategory,
} = postsSlice.actions;
export default postsSlice.reducer;