import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postsApi } from '../../services/postsApi';

// ─────────────────────────────────────────
// THUNKS (نفس الكود القديم، لم يتغير)
// ─────────────────────────────────────────

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ page = 1, perPage = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await postsApi.getArticles(page, perPage, search);
      return { posts: response.data, pagination: response.meta };
    } catch (err) {
      if (err.message && (err.message.includes('Unexpected token') || err.message.includes('HTML'))) {
        return rejectWithValue('الخادم غير متاح حالياً. يرجى المحاولة لاحقاً.');
      }
      return rejectWithValue(err.message || 'حدث خطأ أثناء جلب المقالات');
    }
  }
);

export const fetchArticleDetail = createAsyncThunk(
  'posts/fetchArticleDetail',
  async (articleId, { rejectWithValue }) => {
    try {
      const response = await postsApi.getArticleById(articleId);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchArticleComments = createAsyncThunk(
  'posts/fetchArticleComments',
  async ({ articleId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await postsApi.getArticleComments(articleId, page);
      return { articleId, comments: response.data, meta: response.meta };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchArticleReactions = createAsyncThunk(
  'posts/fetchArticleReactions',
  async ({ articleId, type = null, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await postsApi.getArticleReactions(articleId, perPage, type);
      return { articleId, reactions: response.data, meta: response.meta };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyReactionsAndMerge = createAsyncThunk(
  'posts/fetchMyReactionsAndMerge',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      if (!token || token === 'undefined') return { reactions: [] };
      const response = await postsApi.getMyReactions(token, 100);
      return { reactions: response.data || [] };
    } catch (err) {
      return { reactions: [] };
    }
  }
);

export const fetchMyCommentReactionsAndMerge = createAsyncThunk(
  'posts/fetchMyCommentReactionsAndMerge',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      if (!token || token === 'undefined') return { reactions: [] };
      const response = await postsApi.getMyReactions(token, 100);
      return { reactions: response.data || [] };
    } catch (err) {
      return { reactions: [] };
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ title, content, coverImageFile }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (coverImageFile) formData.append('cover_image', coverImageFile);
      const response = await postsApi.createArticle(formData, token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyArticles = createAsyncThunk(
  'posts/fetchMyArticles',
  async ({ status = null, page = 1, perPage = 15 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await postsApi.getMyArticles(token, status, page, perPage);
      return { articles: response.data, meta: response.meta };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ articleId, title, content, coverImageFile }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('_method', 'PATCH');
      if (title) formData.append('title', title);
      if (content) formData.append('content', content);
      if (coverImageFile) formData.append('cover_image', coverImageFile);
      const response = await postsApi.updateArticle(articleId, formData, token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (articleId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await postsApi.deleteArticleSoft(articleId, token);
      return articleId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const restorePost = createAsyncThunk(
  'posts/restorePost',
  async (articleId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await postsApi.restoreArticle(articleId, token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const forceDeletePost = createAsyncThunk(
  'posts/forceDeletePost',
  async (articleId, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await postsApi.forceDeleteArticle(articleId, token);
      return articleId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchTrashedArticles = createAsyncThunk(
  'posts/fetchTrashedArticles',
  async ({ page = 1 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await postsApi.getTrashedArticles(token, page);
      return { articles: response.data, meta: response.meta };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await postsApi.addComment(postId, content, token);
      return { postId, comment: response.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const editComment = createAsyncThunk(
  'posts/editComment',
  async ({ commentId, content }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await postsApi.editComment(commentId, content, token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ commentId, articleId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await postsApi.deleteComment(commentId, token);
      return { commentId, articleId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const reactToPost = createAsyncThunk(
  'posts/reactToPost',
  async ({ postId, type }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const result = await postsApi.reactToArticle(postId, type, token);
      return { postId, type, result };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyComments = createAsyncThunk(
  'posts/fetchMyComments',
  async ({ perPage = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await postsApi.getMyComments(token, perPage);
      return { comments: response.data, meta: response.meta };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMyReactions = createAsyncThunk(
  'posts/fetchMyReactions',
  async ({ perPage = 20, type = null } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await postsApi.getMyReactions(token, perPage, type);
      return { reactions: response.data, meta: response.meta };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const reactToComment = createAsyncThunk(
  'posts/reactToComment',
  async ({ commentId, type }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const result = await postsApi.reactToComment(commentId, type, token);
      return { commentId, type, result };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────

const initialState = {
  posts: [],
  loading: false,
  error: null,
  filter: 'all',
  category: 'all',
  pagination: { currentPage: 1, lastPage: 1, total: 0 },
  submitting: false,

  // ✅ إضافة currentArticle لتخزين المقالة المعروضة في PostDetailPage
  currentArticle: null,

  commentsByArticle: {},
  reactionsByArticle: {},

  myArticles: { data: [], loading: false, error: null, meta: {} },
  trashedArticles: { data: [], loading: false, error: null, meta: {} },

  myComments: { data: [], loading: false, error: null, meta: {} },
  myReactions: { data: [], loading: false, error: null, meta: {} },
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setFilter: (state, action) => { state.filter = action.payload; },
    setCategory: (state, action) => { state.category = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchPosts ──────────────────────────────────
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.posts = payload.posts.map(post => ({
          ...post,
          user: post.user || post.author || { name: 'مجهول', id: null, avatar: null, roles: [] }
        }));
        state.pagination = {
          currentPage: payload.pagination?.current_page ?? 1,
          lastPage: payload.pagination?.last_page ?? 1,
          total: payload.pagination?.total ?? 0,
        };
      })
      .addCase(fetchPosts.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // ── fetchMyReactionsAndMerge ────────────────────
      .addCase(fetchMyReactionsAndMerge.fulfilled, (state, { payload }) => {
        const { reactions } = payload;
        if (!reactions?.length) return;
        const map = {};
        reactions.forEach(r => {
          if (r.reactionable_type === 'Article') {
            map[r.reactionable_id] = r.type;
          }
        });
        state.posts = state.posts.map(post => ({
          ...post,
          user_reaction: map[post.id] ?? null,
        }));
      })
      .addCase(fetchMyCommentReactionsAndMerge.fulfilled, (state, { payload }) => {
        const { reactions } = payload;
        if (!reactions?.length) return;
        const commentReactionMap = {};
        reactions.forEach(r => {
          if (r.reactionable_type === 'Comment') {
            commentReactionMap[r.reactionable_id] = r.type;
          }
        });
        Object.values(state.commentsByArticle).forEach(bucket => {
          if (bucket?.data) {
            bucket.data = bucket.data.map(comment => ({
              ...comment,
              user_reaction: commentReactionMap[comment.id] ?? comment.user_reaction ?? null
            }));
          }
        });
      })

      // ── createPost ─────────────────────────────────
      .addCase(createPost.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createPost.fulfilled, (state) => { state.submitting = false; })
      .addCase(createPost.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      })

      // ── fetchMyArticles ─────────────────────────────
      .addCase(fetchMyArticles.pending, (state) => {
        state.myArticles.loading = true;
        state.myArticles.error = null;
      })
      .addCase(fetchMyArticles.fulfilled, (state, { payload }) => {
        state.myArticles = { data: payload.articles, meta: payload.meta, loading: false, error: null };
      })
      .addCase(fetchMyArticles.rejected, (state, { payload }) => {
        state.myArticles.loading = false;
        state.myArticles.error = payload;
      })

      // ── updatePost ──────────────────────────────────
      .addCase(updatePost.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(updatePost.fulfilled, (state, { payload }) => {
        state.submitting = false;
        const idx = state.myArticles.data.findIndex(a => a.id === payload?.id);
        if (idx !== -1) state.myArticles.data[idx] = payload;
      })
      .addCase(updatePost.rejected, (state, { payload }) => {
        state.submitting = false;
        state.error = payload;
      })

      // ── deletePost ──────────────────────────────────
      .addCase(deletePost.fulfilled, (state, { payload: articleId }) => {
        state.posts = state.posts.filter(p => p.id !== articleId);
        state.myArticles.data = state.myArticles.data.filter(a => a.id !== articleId);
      })

      // ── fetchTrashedArticles ────────────────────────
      .addCase(fetchTrashedArticles.pending, (state) => {
        state.trashedArticles.loading = true;
        state.trashedArticles.error = null;
      })
      .addCase(fetchTrashedArticles.fulfilled, (state, { payload }) => {
        state.trashedArticles = { data: payload.articles, meta: payload.meta, loading: false, error: null };
      })
      .addCase(fetchTrashedArticles.rejected, (state, { payload }) => {
        state.trashedArticles.loading = false;
        state.trashedArticles.error = payload;
      })

      // ── restorePost ─────────────────────────────────
      .addCase(restorePost.fulfilled, (state, { payload }) => {
        if (payload?.id)
          state.trashedArticles.data = state.trashedArticles.data.filter(a => a.id !== payload.id);
      })

      // ── forceDeletePost ─────────────────────────────
      .addCase(forceDeletePost.fulfilled, (state, { payload: articleId }) => {
        state.trashedArticles.data = state.trashedArticles.data.filter(a => a.id !== articleId);
      })

      // ── fetchArticleComments ───────────────────────
      .addCase(fetchArticleComments.pending, (state, { meta }) => {
        const id = meta.arg.articleId;
        state.commentsByArticle[id] = { ...(state.commentsByArticle[id] || {}), loading: true, error: null };
      })
      .addCase(fetchArticleComments.fulfilled, (state, { payload }) => {
        const { articleId, comments, meta } = payload;
        state.commentsByArticle[articleId] = { data: comments, meta, loading: false, error: null };
      })
      .addCase(fetchArticleComments.rejected, (state, { payload, meta }) => {
        const id = meta.arg.articleId;
        state.commentsByArticle[id] = { ...(state.commentsByArticle[id] || {}), loading: false, error: payload };
      })

      // ── fetchArticleReactions ──────────────────────
      .addCase(fetchArticleReactions.pending, (state, { meta }) => {
        const id = meta.arg.articleId;
        state.reactionsByArticle[id] = { ...(state.reactionsByArticle[id] || {}), loading: true, error: null };
      })
      .addCase(fetchArticleReactions.fulfilled, (state, { payload }) => {
        const { articleId, reactions, meta } = payload;
        state.reactionsByArticle[articleId] = { data: reactions, meta, loading: false, error: null };
      })
      .addCase(fetchArticleReactions.rejected, (state, { payload, meta }) => {
        const id = meta.arg.articleId;
        state.reactionsByArticle[id] = { ...(state.reactionsByArticle[id] || {}), loading: false, error: payload };
      })

      // ── addComment ─────────────────────────────────
      .addCase(addComment.fulfilled, (state, { payload }) => {
        const { postId, comment } = payload;
        const bucket = state.commentsByArticle[postId];
        if (bucket) {
          bucket.data = [comment, ...(bucket.data || [])];
          if (bucket.meta) bucket.meta.total = (bucket.meta.total || 0) + 1;
        }
        const post = state.posts.find(p => p.id === postId);
        if (post) post.comments_count = (post.comments_count || 0) + 1;
      })

      // ── editComment ────────────────────────────────
      .addCase(editComment.fulfilled, (state, { payload }) => {
        if (!payload?.id) return;
        Object.values(state.commentsByArticle).forEach(bucket => {
          if (!bucket.data) return;
          const idx = bucket.data.findIndex(c => c.id === payload.id);
          if (idx !== -1) bucket.data[idx] = { ...bucket.data[idx], ...payload };
        });
      })

      // ── deleteComment ──────────────────────────────
      .addCase(deleteComment.fulfilled, (state, { payload }) => {
        const { commentId, articleId } = payload;
        const bucket = state.commentsByArticle[articleId];
        if (bucket?.data) {
          bucket.data = bucket.data.filter(c => c.id !== commentId);
          if (bucket.meta) bucket.meta.total = Math.max(0, (bucket.meta.total || 1) - 1);
        }
        const post = state.posts.find(p => p.id === articleId);
        if (post) post.comments_count = Math.max(0, (post.comments_count || 1) - 1);
      })

      // ── reactToPost ────────────────────────────────
      .addCase(reactToPost.fulfilled, (state, { payload }) => {
        const { postId, type, result } = payload;
        const post = state.posts.find(p => p.id === postId);
        if (!post) return;

        if (result?.message === 'Reaction removed.') {
          if (type === 'like') post.reactions_count = Math.max(0, (post.reactions_count || 0) - 1);
          if (type === 'dislike') post.dislikes_count = Math.max(0, (post.dislikes_count || 0) - 1);
          post.user_reaction = null;
        } else {
          const old = post.user_reaction;
          if (old === 'like') post.reactions_count = Math.max(0, (post.reactions_count || 0) - 1);
          if (old === 'dislike') post.dislikes_count = Math.max(0, (post.dislikes_count || 0) - 1);
          if (type === 'like') post.reactions_count = (post.reactions_count || 0) + 1;
          if (type === 'dislike') post.dislikes_count = (post.dislikes_count || 0) + 1;
          post.user_reaction = type;
        }
      })
      .addCase(reactToComment.fulfilled, (state, { payload }) => {
        const { commentId, type, result } = payload;
        for (const articleId in state.commentsByArticle) {
          const bucket = state.commentsByArticle[articleId];
          if (!bucket?.data) continue;
          const comment = bucket.data.find(c => c.id === commentId);
          if (comment) {
            if (result?.message === 'Reaction removed.') {
              if (type === 'like') comment.reactions_count = Math.max(0, (comment.reactions_count || 0) - 1);
              if (type === 'dislike') comment.dislikes_count = Math.max(0, (comment.dislikes_count || 0) - 1);
              comment.user_reaction = null;
            } else {
              const old = comment.user_reaction;
              if (old === 'like') comment.reactions_count = Math.max(0, (comment.reactions_count || 0) - 1);
              if (old === 'dislike') comment.dislikes_count = Math.max(0, (comment.dislikes_count || 0) - 1);
              if (type === 'like') comment.reactions_count = (comment.reactions_count || 0) + 1;
              if (type === 'dislike') comment.dislikes_count = (comment.dislikes_count || 0) + 1;
              comment.user_reaction = type;
            }
            break;
          }
        }
      })

      // ── fetchMyComments ────────────────────────────
      .addCase(fetchMyComments.pending, (state) => {
        state.myComments.loading = true;
        state.myComments.error = null;
      })
      .addCase(fetchMyComments.fulfilled, (state, { payload }) => {
        state.myComments = { data: payload.comments, meta: payload.meta, loading: false, error: null };
      })
      .addCase(fetchMyComments.rejected, (state, { payload }) => {
        state.myComments.loading = false;
        state.myComments.error = payload;
      })

      // ── fetchArticleDetail ──────────────────────────
      .addCase(fetchArticleDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticleDetail.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.currentArticle = payload;
      })
      .addCase(fetchArticleDetail.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        state.currentArticle = null;
      })

      // ── fetchMyReactions ────────────────────────────
      .addCase(fetchMyReactions.pending, (state) => {
        state.myReactions.loading = true;
        state.myReactions.error = null;
      })
      .addCase(fetchMyReactions.fulfilled, (state, { payload }) => {
        state.myReactions.loading = false;
        state.myReactions.data = payload.reactions;
        state.myReactions.meta = payload.meta;
      })
      .addCase(fetchMyReactions.rejected, (state, { payload }) => {
        state.myReactions.loading = false;
        state.myReactions.error = payload;
      });
  },
});

export const { setFilter, setCategory, clearError } = postsSlice.actions;
export default postsSlice.reducer;