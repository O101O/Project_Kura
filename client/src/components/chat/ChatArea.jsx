import { ChevronLeft, ImagePlus, SendHorizontal, Smile } from 'lucide-react';
import { useEffect, useRef } from 'react';

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ChatArea = ({
  currentUser,
  selectedChat,
  messages,
  draft,
  setDraft,
  sendMessage,
  onUpload,
  typing,
  setTyping,
  isFriendOnline,
  onBack,
  canMessage,
  blockedMessage
}) => {
  const scrollRef = useRef(null);
  const messageEndRef = useRef(null);
  const safeMessages = Array.isArray(messages) ? messages : [];

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages, selectedChat]);

  if (!selectedChat) {
    return (
      <section className="kura-card flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-base font-medium text-slate-700 dark:text-slate-200">Select a conversation to start chatting</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your messages will appear here in real time.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="kura-card flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-4 md:px-5 dark:border-slate-700/80">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="kura-icon-btn p-2 md:hidden"
            aria-label="Back to conversations"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <img
          src={(selectedChat.type === 'group' ? selectedChat.groupPic : selectedChat.profilePic) || `https://api.dicebear.com/8.x/initials/svg?seed=${selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}`}
          alt={selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}
          className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-100">{selectedChat.type === 'group' ? selectedChat.name : selectedChat.username}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedChat.type === 'group'
              ? `${selectedChat.memberCount} member${selectedChat.memberCount === 1 ? '' : 's'}${selectedChat.isAdmin ? ' • You are admin' : ''}`
              : isFriendOnline ? 'Online now' : 'Last seen recently'}
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50/70 p-5 dark:bg-slate-900/40">
        <div className="space-y-4">
        {safeMessages.length === 0 && (
          <div className="mt-10 text-center text-sm text-slate-400 dark:text-slate-500">
            No messages yet. Start the conversation.
          </div>
        )}
        {safeMessages.map((message) => {
          const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
          const senderName = typeof message.sender === 'object' ? message.sender?.username : selectedChat.username;
          const isMine = String(senderId) === String(currentUser?._id);
          const hasText = Boolean(message.text?.trim());
          const hasImage = Boolean(message.image);

          if (!hasText && !hasImage) {
            return null;
          }

          return (
            <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-popIn`}>
              <div
                className={`max-w-[75%] rounded-2xl border px-4 py-2.5 shadow-sm ${
                  isMine
                    ? 'border-brand-500/20 bg-gradient-to-br from-brand-600 to-blue-500 text-white'
                    : 'border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {selectedChat.type === 'group' && !isMine && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    {senderName}
                  </p>
                )}
                {hasText && <p className="text-sm leading-relaxed">{message.text}</p>}
                {hasImage && (
                  <img
                    src={message.image}
                    alt="sent"
                    className={`${hasText ? 'mt-2' : ''} max-w-xs rounded-lg`}
                  />
                )}
                <p className={`mt-1.5 text-[11px] ${isMine ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        {typing && (
          <p className="w-fit rounded-full bg-white px-3 py-1 text-xs text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
            {selectedChat.type === 'group' ? 'Someone is typing...' : `${selectedChat.username} is typing...`}
          </p>
        )}
          <div ref={messageEndRef} />
        </div>
      </div>

      <form
        className="flex items-center gap-2.5 border-t border-slate-200/80 bg-white px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:px-4 dark:border-slate-700/80 dark:bg-slate-900"
        onSubmit={sendMessage}
      >
        <button type="button" className="kura-icon-btn" aria-label="emoji">
          <Smile size={18} />
        </button>
        <label className={`kura-icon-btn ${canMessage ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} aria-label="upload">
          <ImagePlus size={18} />
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={!canMessage} />
        </label>
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setTyping(Boolean(e.target.value));
          }}
          className="kura-input flex-1 py-2.5"
          placeholder={canMessage ? 'Write a message...' : blockedMessage}
          disabled={!canMessage}
        />
        <button
          type="submit"
          disabled={!canMessage}
          className="rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 p-2.5 text-white shadow-lg shadow-indigo-200/60 hover:-translate-y-0.5 hover:shadow-xl dark:shadow-indigo-900/30"
          aria-label="send"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </section>
  );
};

export default ChatArea;
