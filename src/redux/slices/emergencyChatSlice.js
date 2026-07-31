// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import * as emergencyApi from '../../services/emergencyApi';

// export const listChats = createAsyncThunk(
//     'emergencyChat/listChats',
//     async (_, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await emergencyApi.listChats(token);
//             return response.data; // [{ context, group, membership_type, ... }]
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const fetchMessages = createAsyncThunk(
//     'emergencyChat/fetchMessages',
//     async ({ context, perPage = 20, page = 1 }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await emergencyApi.getChatMessages(token, context, perPage, page);
//             return { context, messages: response.data, meta: response.meta };
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const sendMessage = createAsyncThunk(
//     'emergencyChat/sendMessage',
//     async ({ context, content }, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await emergencyApi.sendChatMessage(token, context, content);
//             return { context, message: response.data };
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );
// export const fetchHomeGroupMembers = createAsyncThunk(
//     'emergencyChat/fetchHomeMembers',
//     async (_, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await emergencyApi.getHomeGroupMembers(token);
//             return { context: 'home', members: response.data };
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// export const fetchGuestGroupMembers = createAsyncThunk(
//     'emergencyChat/fetchGuestMembers',
//     async (_, { getState, rejectWithValue }) => {
//         try {
//             const token = getState().user.currentUser?.token || localStorage.getItem('token');
//             const response = await emergencyApi.getGuestGroupMembers(token);
//             return { context: 'guest', members: response.data };
//         } catch (err) {
//             return rejectWithValue(err.message);
//         }
//     }
// );

// const initialState = {
//     chats: [],
//     messagesByContext: {},
//     loading: false,
//     sending: false,
//     error: null,
//     membersByContext: {},

// };

// const emergencyChatSlice = createSlice({
//     name: 'emergencyChat',
//     initialState,
//     reducers: {
//         clearChatContext: (state, { payload: context }) => {
//             delete state.messagesByContext[context];
//         },
//         addMessageLocal: (state, { payload: { context, message } }) => {
//             if (state.messagesByContext[context]) {
//                 state.messagesByContext[context].data.unshift(message);
//             }
//         },
//     },
//     extraReducers: (builder) => {
//         builder
//             .addCase(listChats.fulfilled, (state, { payload }) => {
//                 state.chats = payload;
//             })
//             .addCase(fetchMessages.pending, (state) => { state.loading = true; })
//             .addCase(fetchMessages.fulfilled, (state, { payload }) => {
//                 state.loading = false;
//                 state.messagesByContext[payload.context] = {
//                     data: payload.messages,
//                     meta: payload.meta,
//                 };
//             })
//             .addCase(fetchMessages.rejected, (state, { payload }) => {
//                 state.loading = false;
//                 state.error = payload;
//             })
//             .addCase(sendMessage.pending, (state) => { state.sending = true; })
//             .addCase(sendMessage.fulfilled, (state, { payload }) => {
//                 state.sending = false;
//                 const bucket = state.messagesByContext[payload.context];
//                 if (bucket) bucket.data.unshift(payload.message);
//             })
//             .addCase(sendMessage.rejected, (state, { payload }) => {
//                 state.sending = false;
//                 state.error = payload;
//             })
//             .addCase(fetchHomeGroupMembers.fulfilled, (state, { payload }) => {
//                 state.membersByContext[payload.context] = payload.members;
//             })
//             .addCase(fetchGuestGroupMembers.fulfilled, (state, { payload }) => {
//                 state.membersByContext[payload.context] = payload.members;
//             });

//     },
// });

// export const { clearChatContext, addMessageLocal } = emergencyChatSlice.actions;
// export default emergencyChatSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as emergencyApi from '../../services/emergencyApi';

export const listChats = createAsyncThunk(
  'emergencyChat/listChats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.listChats(token);
      return response.data; // [{ context, group_id, group_name, can_send }]
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'emergencyChat/fetchMessages',
  async ({ context, perPage = 20, page = 1 }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getChatMessages(token, context, perPage, page);
      return { context, messages: response.data, meta: response.meta };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'emergencyChat/sendMessage',
  async ({ context, content }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.sendChatMessage(token, context, content);
      // The realtime `.message.sent` event is what actually appends the message
      // to the list (see subscribeToGroupChat) — this thunk just confirms delivery.
      return { context, message: response.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchHomeGroupMembers = createAsyncThunk(
  'emergencyChat/fetchHomeMembers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getHomeGroupMembers(token);
      return { context: 'home', members: response.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ✅ Typing + presence heartbeats (fire-and-forget from the UI, but exposed as
// thunks so components don't need to reach into emergencyApi directly)
export const sendTyping = createAsyncThunk(
  'emergencyChat/sendTyping',
  async ({ context, typing }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await emergencyApi.sendTypingIndicator(token, context, typing);
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const sendPresence = createAsyncThunk(
  'emergencyChat/sendPresence',
  async ({ context }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await emergencyApi.sendPresenceHeartbeat(token, context);
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markRead = createAsyncThunk(
  'emergencyChat/markRead',
  async ({ context, messageIds }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      await emergencyApi.markChatRead(token, context, messageIds);
      return { context, messageIds };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
export const sendMessageWithAttachment = createAsyncThunk(
  'emergencyChat/sendWithAttachment',
  async ({ context, content, attachmentFile }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.sendChatMessageWithAttachment(token, context, content, attachmentFile);
      return { context, message: response.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// إضافة ثانك جديد لجلب المزيد من الرسائل (صفحة محددة)
export const fetchMoreMessages = createAsyncThunk(
  'emergencyChat/fetchMoreMessages',
  async ({ context, perPage = 30, page }, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.currentUser?.token || localStorage.getItem('token');
      const response = await emergencyApi.getChatMessages(token, context, perPage, page);
      return { context, messages: response.data, meta: response.meta, page };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  chats: [],
  messagesByContext: {},   // { home: { data: [...], meta } }
  membersByContext: {},    // { home: [{ id, name, avatar, last_seen_at, is_online, roles }] }
  typingByContext: {},     // { home: { [userId]: { name, since } } }
  metaByContext: {},
  loading: false,
  sending: false,
  error: null,
};

const TYPING_TTL_MS = 5000; // auto-clear a typing badge if no "stop" event arrives

const emergencyChatSlice = createSlice({
  name: 'emergencyChat',
  initialState,
  reducers: {
    clearChatContext: (state, { payload: context }) => {
      delete state.messagesByContext[context];
      delete state.typingByContext[context];
    },

    // ── Realtime: .message.sent ──
    receiveMessage: (state, { payload }) => {
      const context = payload.chat_context || 'home';
      const bucket = state.messagesByContext[context];
      if (!bucket) return;
      const exists = bucket.data.some(m => m.id === payload.id);
      if (!exists) bucket.data.push(payload); // ✅ استخدم push لإضافة في النهاية

      // إزالة مؤشر الكتابة (كما هو)
      if (payload.sender?.id && state.typingByContext[context]) {
        delete state.typingByContext[context][payload.sender.id];
      }
    },

    // ── Realtime: .message.deleted ──
    removeMessageRealtime: (state, { payload: { id }, meta }) => {
      const context = meta?.context || 'home';
      const bucket = state.messagesByContext[context];
      if (bucket) bucket.data = bucket.data.filter(m => m.id !== id);
    },

    // ── Realtime: .message.spam-toggled ──
    setSpamFlag: (state, { payload: { id, is_reported_spam }, meta }) => {
      const context = meta?.context || 'home';
      const bucket = state.messagesByContext[context];
      const msg = bucket?.data.find(m => m.id === id);
      if (msg) msg.is_reported_spam = is_reported_spam;
    },

    // ── Realtime: .messages.read ──
    applyReadReceipts: (state, { payload },) => {
      const context = payload.context || 'home';
      const bucket = state.messagesByContext[context];
      if (!bucket) return;
      payload.messages?.forEach(({ message_id, read_count, recipient_count }) => {
        const msg = bucket.data.find(m => m.id === message_id);
        if (msg) msg.read_receipt = { read_count, recipient_count };
      });
    },

    // ── Realtime: .user.typing ──
    setUserTyping: (state, { payload }) => {
      const context = payload.context || 'home';
      if (!state.typingByContext[context]) state.typingByContext[context] = {};
      if (payload.typing) {
        state.typingByContext[context][payload.user.id] = {
          name: payload.user.name,
          since: Date.now(),
        };
      } else {
        delete state.typingByContext[context][payload.user.id];
      }
    },

    // Sweep stale typing entries (called on an interval from the UI)
    pruneStaleTyping: (state) => {
      const now = Date.now();
      Object.keys(state.typingByContext).forEach(context => {
        const entries = state.typingByContext[context];
        Object.keys(entries).forEach(userId => {
          if (now - entries[userId].since > TYPING_TTL_MS) delete entries[userId];
        });
      });
    },

    // ── Realtime: .user.presence ──
    setUserPresence: (state, { payload }) => {
      const context = payload.context || 'home';
      const members = state.membersByContext[context];
      if (!members) return;
      const member = members.find(m => m.id === payload.user.id);
      if (member) {
        member.last_seen_at = payload.last_seen_at;
        member.is_online = payload.is_online;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listChats.fulfilled, (state, { payload }) => {
        state.chats = payload;
      })
      .addCase(fetchMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMessages.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.metaByContext[payload.context] = payload.meta;
        state.messagesByContext[payload.context] = {
          data: payload.messages,
          meta: payload.meta,
        };
      })
      // أضف معالج fetchMoreMessages
      .addCase(fetchMoreMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMoreMessages.fulfilled, (state, { payload }) => {
        state.loading = false;
        const context = payload.context;
        const bucket = state.messagesByContext[context];
        if (bucket) {
          // ✅ إضافة الرسائل القديمة في بداية القائمة (أعلى)
          bucket.data = [...payload.messages, ...bucket.data];
          // تحديث meta (لتحديث current_page)
          if (payload.meta) {
            state.metaByContext[context] = payload.meta;
            bucket.meta = payload.meta;
          }
        }
      })
      .addCase(fetchMoreMessages.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(fetchMessages.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(sendMessage.pending, (state) => { state.sending = true; })
      .addCase(sendMessage.fulfilled, (state) => { state.sending = false; })
      .addCase(sendMessage.rejected, (state, { payload }) => {
        state.sending = false;
        state.error = payload;
      })
      .addCase(fetchHomeGroupMembers.fulfilled, (state, { payload }) => {
        state.membersByContext[payload.context] = payload.members;
      });
  },
});

export const {
  clearChatContext,
  receiveMessage,
  removeMessageRealtime,
  setSpamFlag,
  applyReadReceipts,
  setUserTyping,
  pruneStaleTyping,
  setUserPresence,
} = emergencyChatSlice.actions;

export default emergencyChatSlice.reducer;