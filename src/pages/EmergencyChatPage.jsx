// EmergencyChatPage.jsx (النسخة الكاملة المصححة)
import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import ReportModal from '../components/Reports/ReportModal';
import { useLanguage } from '../contexts/LanguageContext';
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
import { FaPaperPlane, FaHome, FaUsers, FaChevronDown, FaUserCircle, FaPaperclip, FaSpinner, FaStar, FaTimes, FaFlag } from 'react-icons/fa';
import RateUserModal from '../components/Ratings/RateUserModal';
import { formatMessageTime, formatRelativeTime } from '../utils/dateHelpers';

const CONTEXT = 'home';
const TYPING_THROTTLE_MS = 800;
const PRESENCE_INTERVAL_MS = 30_000;
const TYPING_SWEEP_MS = 1500;
const MESSAGES_PER_PAGE = 30;

const formatLastSeen = (iso) => {
  if (!iso) return null;
  return formatRelativeTime(iso);
};

// ── Avatar ──────────────────────────────────────────────────────
const Avatar = memo(({ name, src, isOnline, size = 9 }) => {
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div className="relative shrink-0 transition-transform duration-200 hover:scale-105">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm`}
          loading="lazy"
        />
      ) : (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold ring-2 ring-white dark:ring-gray-800 shadow-sm`}>
          {name?.charAt(0)?.toUpperCase() || <FaUserCircle className="w-full h-full p-1" />}
        </div>
      )}
      {isOnline && (
        <span
          className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 shadow-sm"
          title="متصل الآن"
        />
      )}
    </div>
  );
});
Avatar.displayName = 'Avatar';

// ── Message bubble ──────────────────────────────────────────────
// ── Message bubble (معدل مع زر إبلاغ محسّن) ──
const MessageBubble = memo(({ msg, isOwn }) => {
  const { t } = useTranslation();
  const { currentLang } = useLanguage(); // ✅ لجلب اتجاه اللغة
  const hasAttachment = msg.attachment?.url || msg.attachment_url;
  const [showReportModal, setShowReportModal] = useState(false);

  const isRTL = currentLang === 'ar';
  const canReport = !isOwn && msg.sender?.id;

  return (
    <>
      <div className={`flex items-end gap-2 animate-fade-up ${isOwn ? 'justify-end' : 'justify-start'} group relative`}>
        {/* ✅ زر الإبلاغ - يظهر عند hover على الرسالة، ويوضع على يسارها (أو يمينها) */}
        {canReport && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReportModal(true);
            }}
            className={`
              opacity-0 group-hover:opacity-100 transition-all duration-200
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
              bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50
              text-red-600 dark:text-red-400 text-xs font-medium
              hover:scale-105 active:scale-95
              shadow-sm hover:shadow-md
              ${isRTL ? 'ml-2' : 'mr-2'}
            `}
            title={t('reports.reportSpamMessage')}
          >
            <FaFlag className="text-xs" />
            {t('reports.report')}
          </button>
        )}

        {/* صورة المستخدم (للمرسل) */}
        {!isOwn && (
          <Avatar
            name={msg.sender?.name}
            src={msg.sender?.avatar}
            isOnline={msg.sender?.is_online}
            size={7}
          />
        )}

        {/* فقاعة الرسالة */}
        <div className={`
          max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
          ${isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
          }
          transition-all duration-200 hover:shadow-md
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
                className="max-w-full max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
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
              {formatMessageTime(msg.sent_at || msg.created_at)}
            </span>
            {isOwn && msg.read_receipt && (
              <span className="text-[10px]" title={t('emergency.readReceipt')}>
                {msg.read_receipt.read_count >= msg.read_receipt.recipient_count ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* مودال الإبلاغ */}
      {canReport && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedId={msg.sender.id}
          reportedName={msg.sender.name}
          messageId={msg.id}
        />
      )}
    </>
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

// ── Member item (معدل مع زر الإبلاغ) ──────────────────────────
const MemberItem = memo(({ member, groupId, currentUserId, isTrusted }) => {
  const { t } = useTranslation();
  const [showRateModal, setShowRateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const userId = member?.id || member?.user_id || member?.userId;
  const displayName = member?.name || member?.display_name || t('emergency.unknown');
  const avatar = member?.avatar || member?.profile_photo_url;
  const isOnline = member?.is_online ?? false;
  const lastSeenAt = member?.last_seen_at;

  let lastSeenLabel = t('emergency.unavailable');
  if (isOnline) {
    lastSeenLabel = t('emergency.onlineNow');
  } else if (lastSeenAt) {
    const formatted = formatLastSeen(lastSeenAt);
    if (formatted) lastSeenLabel = formatted;
  }

  const canRate = isTrusted && currentUserId && userId && userId !== currentUserId;

  return (
    <>
      <li className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group cursor-default">
        <Avatar name={displayName} src={avatar} isOnline={isOnline} size={10} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {member?.roles?.includes('rescuer') && (
              <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                {t('emergency.rescuerBadge')}
              </span>
            )}
            <span className={`text-[10px] ${isOnline ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
              {lastSeenLabel}
            </span>
          </div>
        </div>

        {/* ✅ أزرار التقييم والإبلاغ */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {canRate && userId && (
            <button
              onClick={() => setShowRateModal(true)}
              className="text-gray-400 hover:text-primary text-xs flex items-center gap-1 hover:scale-110 transition-all duration-200"
              title={t('ratings.rateUser', { name: displayName })}
            >
              <FaStar className="text-[10px]" /> {t('ratings.rate')}
            </button>
          )}
          {canRate && userId && (
            <button
              onClick={() => setShowReportModal(true)}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-400 hover:text-red-600 text-xs flex items-center gap-1 hover:scale-110 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              title={t('reports.report')}
            >
              <FaFlag className="text-[10px]" />
              <span className="text-[10px] font-medium">{t('reports.report')}</span>
            </button>
          )}
        </div>
      </li>

      {canRate && userId && (
        <RateUserModal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          userId={userId}
          userName={displayName}
          groupId={groupId}
        />
      )}

      {canRate && userId && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedId={userId}
          reportedName={displayName}
        />
      )}
    </>
  );
});
MemberItem.displayName = 'MemberItem';

// ── Members Modal ───────────────────────────────────────────
const MembersModal = memo(({ isOpen, onClose, members, groupId, currentUserId, isTrusted, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-white/10 dark:border-gray-700/50 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            {t('emergency.members')} <span className="text-primary text-sm">({members.length})</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="إغلاق"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
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
                  currentUserId={currentUserId}
                  isTrusted={isTrusted}
                />
              ))
          )}
        </ul>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
});
MembersModal.displayName = 'MembersModal';

// ── Main component ──────────────────────────────────────────────
const EmergencyChatPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });

  const [messageText, setMessageText] = useState('');
  const [showMembers, setShowMembers] = useState(!isMobile);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
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

  useEffect(() => {
    dispatch(listChats());
  }, [dispatch]);

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

  useEffect(() => {
    const id = setInterval(() => dispatch(pruneStaleTyping()), TYPING_SWEEP_MS);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    dispatch(sendPresence({ context: CONTEXT }));
    const id = setInterval(() => dispatch(sendPresence({ context: CONTEXT })), PRESENCE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    const id = setInterval(() => dispatch(fetchHomeGroupMembers()), 30000);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    if (!messages.length) return;
    const unread = messages
      .filter(m => m.sender?.id !== currentUser?.id)
      .slice(0, 20)
      .map(m => m.id);
    if (unread.length) dispatch(markRead({ context: CONTEXT, messageIds: unread }));
  }, [messages.length, currentUser?.id, dispatch]);

  useEffect(() => {
    if (atBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, atBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesBoxRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

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

  const toggleMembers = useCallback(() => {
    if (isMobile) {
      setMembersModalOpen(true);
    } else {
      setShowMembers(v => !v);
    }
  }, [isMobile]);

  const closeMembersModal = useCallback(() => setMembersModalOpen(false), []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <Heading title={t('emergency.chatTitle')} subtitle={t('emergency.chatSubtitle')} />
        <button
          onClick={toggleMembers}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          <FaUsers className="text-primary" />
          {isMobile ? t('emergency.viewGroupMembers') : (showMembers ? t('emergency.hideMembers') : `${t('emergency.members')} (${members.length})`)}
        </button>
      </div>

      {!homeChat && !loading && (
        <div className="text-center text-gray-500 text-sm mb-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          {t('emergency.noChatAvailable')}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl"
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
                  className="px-4 py-2 text-xs font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-all duration-200 hover:scale-105 disabled:opacity-50"
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
              className="mx-4 mb-1 flex items-center justify-center gap-1 text-xs text-primary bg-primary/10 py-1.5 rounded-lg hover:bg-primary/20 transition-all duration-200 animate-fade-in hover:scale-105"
            >
              <FaChevronDown className="text-[10px]" /> {t('emergency.newMessages')}
            </button>
          )}

          {homeChat && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">
              {attachmentPreview && (
                <div className="relative mb-2 inline-block animate-fade-up">
                  <img
                    src={attachmentPreview}
                    alt={t('emergency.attachmentPreview')}
                    className="max-h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-600 shadow-sm"
                  />
                  <button
                    onClick={clearAttachment}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200 hover:scale-110 flex items-center justify-center text-xs shadow-md"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 shrink-0"
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
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl resize-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200 max-h-28"
                  style={{ overflowY: 'auto' }}
                />

                <button
                  onClick={handleSend}
                  disabled={sending || (!messageText.trim() && !attachmentFile)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 shrink-0"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <FaPaperPlane className="text-sm" />
                  }
                </button>
              </div>

              {attachmentFile && (
                <p className="text-xs text-primary mt-1.5 animate-fade-up">
                  ✅ {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── قائمة الأعضاء (للكبيرة فقط) ── */}
        {!isMobile && showMembers && (
          <div
            className="w-full md:w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden flex flex-col shrink-0 transition-shadow duration-300 hover:shadow-xl"
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

      {/* ── مودال الأعضاء (للموبايل) ── */}
      <MembersModal
        isOpen={membersModalOpen}
        onClose={closeMembersModal}
        members={members}
        groupId={groupId}
        currentUserId={currentUser?.id}
        isTrusted={isTrusted}
        t={t}
      />
    </div>
  );
};

export default EmergencyChatPage;