import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  listChats,
  fetchMessages,
  fetchMoreMessages,
  sendMessage,
  fetchHomeGroupMembers,
  sendTyping,
  sendPresence,
  markRead,
  receiveMessage,
  removeMessageRealtime,
  setSpamFlag,
  applyReadReceipts,
  setUserTyping,
  pruneStaleTyping,
  setUserPresence,
} from '../redux/slices/emergencyChatSlice';
import { initEcho, subscribeToGroupChat } from '../services/echo';
import { showError } from '../utils/toastHelpers';
import Heading from '../components/Shared/Heading';
import { FaPaperPlane, FaHome, FaUsers, FaChevronDown, FaUserCircle, FaPaperclip, FaSpinner, FaStar } from 'react-icons/fa';
import RateUserModal from '../components/Ratings/RateUserModal';

const CONTEXT = 'home';
const TYPING_THROTTLE_MS = 800;
const PRESENCE_INTERVAL_MS = 30_000;
const TYPING_SWEEP_MS = 1500;
const MESSAGES_PER_PAGE = 30;

// ── Relative "last seen" formatter ──────────────────────────────
const formatLastSeen = (iso) => {
  if (!iso) return null;
  const date = new Date(iso + 'Z');
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} د`;
  if (diffMin < 1440) return `قبل ${Math.floor(diffMin / 60)} س`;
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Avatar ──────────────────────────────────────────────────────
const Avatar = memo(({ name, src, isOnline, size = 9 }) => {
  const dim = `w-${size} h-${size}`;
  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          width={size * 4}
          height={size * 4}
          className={`${dim} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`}
          loading="lazy"
        />
      ) : (
        <div className={`${dim} rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold ring-2 ring-white dark:ring-gray-800`}>
          {name?.charAt(0)?.toUpperCase() || <FaUserCircle />}
        </div>
      )}
      {isOnline && (
        <span
          className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"
          title="متصل الآن"
        />
      )}
    </div>
  );
});
Avatar.displayName = 'Avatar';

// ── Message bubble ──────────────────────────────────────────────
const MessageBubble = memo(({ msg, isOwn }) => {
  const { t } = useTranslation();
  const hasAttachment = msg.attachment?.url || msg.attachment_url;

  return (
    <div className={`flex items-end gap-2 animate-fade-up ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <Avatar
          name={msg.sender?.name}
          src={msg.sender?.avatar}
          isOnline={msg.sender?.is_online}
          size={7}
        />
      )}
      <div className={`
        max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
        ${isOwn
          ? 'bg-primary text-white rounded-br-sm'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
        }
      `}>
        {!isOwn && msg.sender?.name && (
          <p className="text-[10px] font-semibold text-primary/80 dark:text-primary/60 mb-1">
            {msg.sender.name}
          </p>
        )}

        {hasAttachment && (
          <div className="mb-2">
            <img
              src={msg.attachment?.url || msg.attachment_url}
              alt={t('emergency.attachment')}
              className="max-w-full max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition"
              loading="lazy"
              onClick={() => window.open(msg.attachment?.url || msg.attachment_url, '_blank')}
            />
          </div>
        )}

        {msg.content && (
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        )}

        <div className={`flex items-center gap-1.5 mt-1 justify-end ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
          <span className="text-[10px]">
            {new Date(msg.sent_at || msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && msg.read_receipt && (
            <span className="text-[10px]" title={t('emergency.readReceipt')}>
              {msg.read_receipt.read_count >= msg.read_receipt.recipient_count ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// ── Typing indicator ────────────────────────────────────────────
const TypingIndicator = memo(({ names }) => {
  const { t } = useTranslation();
  if (!names.length) return null;
  const label = names.length === 1
    ? `${names[0]} ${t('emergency.typing')}`
    : `${names.length} ${t('emergency.peopleTyping')}`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 animate-fade-in">
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      {label}
    </div>
  );
});
TypingIndicator.displayName = 'TypingIndicator';

// ── Member item ──────────────────────────────────────────────────
const MemberItem = memo(({ member, groupId, currentUserId, isTrusted }) => {
  const { t } = useTranslation();
  const [showRateModal, setShowRateModal] = useState(false);

  // ✅ دعم حقول متعددة للمعرف
  const userId = member?.id || member?.user_id || member?.userId;
  const displayName = member?.name || member?.display_name || t('emergency.unknown');
  const avatar = member?.avatar || member?.profile_photo_url;

  const lastSeenLabel = member?.is_online
    ? t('emergency.onlineNow')
    : (member?.last_seen_at ? formatLastSeen(member.last_seen_at) : t('emergency.unavailable'));

  // لا يمكن تقييم النفس
  const canRate = isTrusted && currentUserId && userId && userId !== currentUserId;

  return (
    <>
      <li className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
        <Avatar name={displayName} src={avatar} isOnline={member?.is_online} size={9} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {member?.roles?.includes('rescuer') && (
              <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                {t('emergency.rescuerBadge')}
              </span>
            )}
            {lastSeenLabel && (
              <span className={`text-[10px] ${member?.is_online ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                {lastSeenLabel}
              </span>
            )}
          </div>
        </div>
        {/* زر التقييم - يظهر فقط للمستخدمين الموثقين (trusted) وليس للنفس */}
        {canRate && userId && (
          <button
            onClick={() => setShowRateModal(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-primary text-xs flex items-center gap-1"
            title={t('ratings.rateUser', { name: displayName })}
          >
            <FaStar className="text-[10px]" /> {t('ratings.rate')}
          </button>
        )}
      </li>

      {/* مودال التقييم */}
      {canRate && userId && (
        <RateUserModal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          userId={userId}
          userName={displayName}
          groupId={groupId}
        />
      )}
    </>
  );
});
MemberItem.displayName = 'MemberItem';

// ── Main component ──────────────────────────────────────────────
const EmergencyChatPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [messageText, setMessageText] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesBoxRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const { chats, messagesByContext, membersByContext, typingByContext, metaByContext, loading, sending } =
    useSelector(s => s.emergencyChat);
  const { currentUser, roles } = useSelector(s => s.user);
  const token = currentUser?.token || localStorage.getItem('token');

  const meta = metaByContext[CONTEXT] || {};
  const messages = messagesByContext[CONTEXT]?.data ?? [];
  const members = membersByContext[CONTEXT] ?? [];
  const homeChat = chats.find(c => c.context === 'home');
  const groupId = homeChat?.group_id || homeChat?.group?.id;
  const { current_page = 1, last_page = 1, total = 0 } = meta;

  const isTrusted = roles?.includes('trusted') || currentUser?.role === 'trusted';

  const typingUsers = useMemo(() => {
    const entries = typingByContext[CONTEXT] || {};
    return Object.entries(entries)
      .filter(([userId]) => Number(userId) !== currentUser?.id)
      .map(([, e]) => e.name);
  }, [typingByContext, currentUser?.id]);

  // ── Bootstrap ──────────────────────────────────────────────────
  useEffect(() => {
    dispatch(listChats());
  }, [dispatch]);

  // ── جلب أحدث صفحة من الرسائل ─────────────────────────────────
  useEffect(() => {
    dispatch(fetchMessages({ context: CONTEXT, perPage: MESSAGES_PER_PAGE, page: 1 }))
      .then((result) => {
        if (fetchMessages.fulfilled.match(result)) {
          const meta = result.payload?.meta;
          if (meta?.last_page > 1) {
            dispatch(fetchMessages({ context: CONTEXT, perPage: MESSAGES_PER_PAGE, page: meta.last_page }));
          }
        }
      });
    dispatch(fetchHomeGroupMembers());
  }, [dispatch]);

  // ── تحميل المزيد من الرسائل (الأقدم) ───────────────────────
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || current_page <= 1) return;
    const nextPage = current_page - 1;
    setLoadingMore(true);
    await dispatch(fetchMoreMessages({
      context: CONTEXT,
      perPage: MESSAGES_PER_PAGE,
      page: nextPage,
    }));
    setLoadingMore(false);
  }, [dispatch, current_page, loadingMore]);

  // ── Realtime subscription ───────────────────────────────────
  useEffect(() => {
    if (!token || !groupId) return;
    initEcho(token);
    const unsubscribe = subscribeToGroupChat(groupId, {
      onMessage: (payload) => dispatch(receiveMessage({ ...payload, chat_context: CONTEXT })),
      onDeleted: (payload) => dispatch(removeMessageRealtime({ payload, meta: { context: CONTEXT } })),
      onSpamToggled: (payload) => dispatch(setSpamFlag({ payload, meta: { context: CONTEXT } })),
      onRead: (payload) => dispatch(applyReadReceipts({ ...payload, context: CONTEXT })),
      onTyping: (payload) => dispatch(setUserTyping({ ...payload, context: CONTEXT })),
      onPresence: (payload) => dispatch(setUserPresence({ ...payload, context: CONTEXT })),
    });
    return unsubscribe;
  }, [dispatch, token, groupId]);

  // ── Sweep typing ─────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => dispatch(pruneStaleTyping()), TYPING_SWEEP_MS);
    return () => clearInterval(id);
  }, [dispatch]);

  // ── Presence heartbeat ──────────────────────────────────────
  useEffect(() => {
    dispatch(sendPresence({ context: CONTEXT }));
    const id = setInterval(() => dispatch(sendPresence({ context: CONTEXT })), PRESENCE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [dispatch]);

  // ── جلب الأعضاء بشكل دوري ──────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => dispatch(fetchHomeGroupMembers()), 30000);
    return () => clearInterval(id);
  }, [dispatch]);

  // ── Mark read ────────────────────────────────────────────────
  useEffect(() => {
    if (!messages.length) return;
    const unread = messages
      .filter(m => m.sender?.id !== currentUser?.id)
      .slice(0, 20)
      .map(m => m.id);
    if (unread.length) dispatch(markRead({ context: CONTEXT, messageIds: unread }));
  }, [messages.length, currentUser?.id, dispatch]);

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    if (atBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, atBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesBoxRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

  // ── Typing ──────────────────────────────────────────────────
  const emitTypingStart = useCallback(() => {
    if (isTypingRef.current) return;
    isTypingRef.current = true;
    dispatch(sendTyping({ context: CONTEXT, typing: true }));
  }, [dispatch]);

  const emitTypingStop = useCallback(() => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    dispatch(sendTyping({ context: CONTEXT, typing: false }));
  }, [dispatch]);

  const handleInputChange = useCallback((e) => {
    setMessageText(e.target.value);
    emitTypingStart();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(emitTypingStop, TYPING_THROTTLE_MS + 400);
  }, [emitTypingStart, emitTypingStop]);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  // ── File attachment ─────────────────────────────────────────
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showError(t('emergency.fileTooLarge'));
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError(t('emergency.fileTypeInvalid'));
      return;
    }
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
    e.target.value = '';
  }, [t]);

  const clearAttachment = useCallback(() => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  }, []);

  // ── Send ──────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text && !attachmentFile) {
      showError(t('emergency.enterMessage'));
      return;
    }
    if (sending) return;

    if (attachmentFile) {
      const formData = new FormData();
      formData.append('context', CONTEXT);
      if (text) formData.append('content', text);
      formData.append('attachment', attachmentFile);

      setMessageText('');
      emitTypingStop();
      clearAttachment();

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://emergency-grad.duckdns.org/api/emergency/chat', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          showError(data.message || t('emergency.sendFailed'));
          if (text) setMessageText(text);
          setAttachmentFile(attachmentFile);
          setAttachmentPreview(URL.createObjectURL(attachmentFile));
        } else {
          dispatch(receiveMessage({ ...data.data, chat_context: CONTEXT }));
          inputRef.current?.focus();
        }
      } catch (error) {
        showError(t('emergency.sendFailed'));
        if (text) setMessageText(text);
        setAttachmentFile(attachmentFile);
        setAttachmentPreview(URL.createObjectURL(attachmentFile));
      }
      return;
    }

    setMessageText('');
    emitTypingStop();
    const result = await dispatch(sendMessage({ context: CONTEXT, content: text }));
    if (sendMessage.rejected.match(result)) {
      showError(result.payload || t('emergency.sendFailed'));
      setMessageText(text);
    } else {
      inputRef.current?.focus();
    }
  }, [messageText, attachmentFile, sending, dispatch, emitTypingStop, clearAttachment, t]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <Heading title={t('emergency.chatTitle')} subtitle={t('emergency.chatSubtitle')} />
        <button
          onClick={() => setShowMembers(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <FaUsers className="text-primary" />
          {showMembers ? t('emergency.hideMembers') : `${t('emergency.members')} (${members.length})`}
        </button>
      </div>

      {!homeChat && !loading && (
        <div className="text-center text-gray-500 text-sm mb-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          {t('emergency.noChatAvailable')}
        </div>
      )}

      <div className="flex gap-5">
        {/* ── منطقة الدردشة ── */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
          style={{ height: '600px' }}>

          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30 text-xs text-gray-500">
            <FaHome className="text-primary" /> {t('emergency.contextBanner')}
          </div>

          <div
            ref={messagesBoxRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth custom-scrollbar"
          >
            {current_page > 1 && (
              <div className="flex justify-center my-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 text-xs font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <><FaSpinner className="animate-spin inline mr-2" /> {t('common.loading')}...</>
                  ) : (
                    `${t('emergency.loadMore')} (${current_page - 1} ${t('emergency.pagesRemaining')})`
                  )}
                </button>
              </div>
            )}

            {loading && messages.length === 0 && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-50">
                <div className="text-4xl">💬</div>
                <p className="text-sm text-gray-400">{t('emergency.noMessages')}</p>
              </div>
            )}

            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.sender?.id === currentUser?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <TypingIndicator names={typingUsers} />

          {!atBottom && (
            <button
              onClick={() => { setAtBottom(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="mx-4 mb-1 flex items-center justify-center gap-1 text-xs text-primary bg-primary/10 py-1.5 rounded-lg hover:bg-primary/20 transition animate-fade-in"
            >
              <FaChevronDown className="text-[10px]" /> {t('emergency.newMessages')}
            </button>
          )}

          {homeChat && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-700">
              {attachmentPreview && (
                <div className="relative mb-2 inline-block">
                  <img
                    src={attachmentPreview}
                    alt={t('emergency.attachmentPreview')}
                    className="max-h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={clearAttachment}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
                  aria-label={t('emergency.attachImage')}
                >
                  <FaPaperclip className="text-lg" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <textarea
                  ref={inputRef}
                  value={messageText}
                  onChange={handleInputChange}
                  onBlur={emitTypingStop}
                  onKeyDown={handleKeyDown}
                  placeholder={attachmentFile ? t('emergency.addTextWithImage') : t('emergency.typeMessage')}
                  rows={1}
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl resize-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-150 max-h-28"
                  style={{ overflowY: 'auto' }}
                />

                <button
                  onClick={handleSend}
                  disabled={sending || (!messageText.trim() && !attachmentFile)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shrink-0"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <FaPaperPlane className="text-sm" />
                  }
                </button>
              </div>

              {attachmentFile && (
                <p className="text-xs text-primary mt-1.5">
                  ✅ {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── القائمة الجانبية للأعضاء ── */}
        {showMembers && (
          <div
            className="w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden flex flex-col animate-slide-in-down shrink-0"
            style={{ height: '600px' }}
          >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>{t('emergency.members')}</span>
                <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {members.length}
                </span>
              </h3>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
              {members.length === 0 ? (
                <li className="text-center text-sm text-gray-400 py-8">{t('emergency.noMembers')}</li>
              ) : (
                members
                  .slice()
                  .sort((a, b) => (b.is_online ? 1 : 0) - (a.is_online ? 1 : 0))
                  .map(member => (
                    <MemberItem
                      key={member.id || `member-${Math.random()}`}
                      member={member}
                      groupId={groupId}
                      currentUserId={currentUser?.id}
                      isTrusted={isTrusted}
                    />
                  ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyChatPage;