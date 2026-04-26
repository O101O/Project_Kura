/**
 * ChatArea component - Main chat interface for displaying messages and composing new ones.
 * Handles message rendering, reactions, replies, edits, and file uploads.
 */

import EmojiPicker from 'emoji-picker-react';
import {
  Check,
  CheckCheck,
  ChevronLeft,
  CornerUpLeft,
  ImagePlus,
  MoreHorizontal,
  Pencil,
  SendHorizontal,
  Smile,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Reaction options available for messages
const REACTION_OPTIONS = ['👍', '❤️', '😂'];

// Utility functions
const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getDeliveryState = (message) => {
  if (message.seen) {
    return 'seen';
  }
  if (message.deliveredAt) {
    return 'delivered';
  }
  return 'sent';
};

const isImageAttachment = (message) => {
  if (message.image) {
    return true;
  }

  return Boolean(message.attachmentUrl && message.attachmentType?.startsWith('image/'));
};

const summarizeMessage = (message) => {
  if (message.text?.trim()) {
    return message.text.trim();
  }

  if (message.attachmentName) {
    return message.attachmentName;
  }

  if (message.image || message.attachmentUrl) {
    return 'Attachment';
  }

  return 'Message';
};

const groupReactions = (message) => {
  const grouped = new Map();

  for (const reaction of message.reactions || []) {
    const existing = grouped.get(reaction.emoji) || { emoji: reaction.emoji, count: 0, userIds: [] };
    existing.count += 1;
    existing.userIds.push(String(reaction.userId));
    grouped.set(reaction.emoji, existing);
  }

  return Array.from(grouped.values());
};

const ChatArea = ({
  currentUser,
  currentUserId,
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
  blockedMessage,
  replyingTo,
  editingMessage,
  onReplyToMessage,
  onStartEditMessage,
  onCancelComposerAction,
  onReactToMessage,
  onDeleteMessage
}) => {
  const scrollRef = useRef(null);
  const messageEndRef = useRef(null);
  const composerRef = useRef(null);
  const sectionRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const safeMessages = Array.isArray(messages) ? messages : [];
  const [showPicker, setShowPicker] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages, selectedChat]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current?.contains(event.target)) {
        return;
      }

      if (event.target.closest('[data-message-menu-trigger="true"]')) {
        return;
      }

      if (!sectionRef.current?.contains(event.target)) {
        setShowPicker(false);
        setOpenMenuId(null);
        return;
      }

      setOpenMenuId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setShowPicker(false);
    setOpenMenuId(null);
  }, [selectedChat?._id]);

  useEffect(() => {
    if (!openMenuId) {
      return undefined;
    }

    const handleViewportChange = () => {
      setOpenMenuId(null);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [openMenuId]);

  const composerMode = useMemo(() => {
    if (editingMessage) {
      return {
        label: 'Editing message',
        sender: 'You',
        text: summarizeMessage(editingMessage),
        icon: <Pencil size={14} />
      };
    }

    if (replyingTo) {
      return {
        label: 'Replying to',
        sender: replyingTo.sender,
        text: replyingTo.text,
        icon: <CornerUpLeft size={14} />
      };
    }

    return null;
  }, [editingMessage, replyingTo]);

  const handleEmojiClick = (emojiData) => {
    setDraft((prev) => prev + emojiData.emoji);
    setTyping(true);
    setShowPicker(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleOpenMenu = (event, messageId) => {
    event.stopPropagation();

    if (openMenuId === messageId) {
      setOpenMenuId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 208;
    const viewportPadding = 16;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding
    );
    const top = Math.min(rect.bottom + 8, window.innerHeight - 220);

    setMenuPosition({ top, left });
    setOpenMenuId(messageId);
  };

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
    <section ref={sectionRef} className="kura-card flex h-full min-h-0 flex-col overflow-hidden">
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
        <div className="space-y-4 overflow-visible">
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
            const hasImage = isImageAttachment(message);
            const hasAttachment = Boolean(message.attachmentUrl);
            const imageUrl = message.image || message.attachmentUrl;
            const attachmentName = message.attachmentName || 'Attachment';
            const groupedReactions = groupReactions(message);

            if (!hasText && !hasAttachment) {
              return null;
            }

            return (
              <div
                key={message._id}
                className={`relative flex overflow-visible ${isMine ? 'justify-end' : 'justify-start'} ${openMenuId === message._id ? 'z-30' : 'z-0'} animate-popIn`}
              >
                <div className="group relative overflow-visible max-w-[78%]">
                  <button
                    data-message-menu-trigger="true"
                    type="button"
                    aria-label="Message options"
                    className={`absolute top-2 z-40 rounded-lg border border-slate-200/80 bg-white/95 p-1.5 text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:bg-slate-800 ${isMine ? '-left-11' : '-right-11'} ${openMenuId === message._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={(event) => handleOpenMenu(event, message._id)}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                  <div
                    className={`rounded-2xl border px-4 py-2.5 shadow-sm ${
                      isMine
                        ? 'border-brand-500/20 bg-gradient-to-br from-brand-600 to-blue-500 text-white'
                        : 'border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      handleOpenMenu(event, message._id);
                    }}
                  >
                    {selectedChat.type === 'group' && !isMine && (
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                        {senderName}
                      </p>
                    )}
                    {message.replyTo && (
                      <div className={`mb-2 rounded-xl border px-3 py-2 text-xs ${isMine ? 'border-white/20 bg-white/10 text-indigo-50' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300'}`}>
                        <p className="font-semibold">{message.replyTo.sender}</p>
                        <p className="mt-0.5 break-words">{message.replyTo.text || 'Attachment'}</p>
                      </div>
                    )}
                    {hasText && <p className="text-sm leading-relaxed break-words">{message.text}</p>}
                    {hasImage && (
                      <img
                        src={imageUrl}
                        alt={attachmentName}
                        className={`${hasText ? 'mt-2' : ''} max-w-xs rounded-lg`}
                      />
                    )}
                    {hasAttachment && !hasImage && (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-2 inline-flex rounded-xl border px-3 py-2 text-sm font-medium ${
                          isMine
                            ? 'border-white/30 bg-white/10 text-white hover:bg-white/15'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {attachmentName}
                      </a>
                    )}
                    <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${isMine ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      <span>{formatTime(message.createdAt)}</span>
                      {message.isEdited && <span>(edited)</span>}
                      {isMine && selectedChat.type === 'direct' && (
                        <span
                          className={`inline-flex items-center ${
                            getDeliveryState(message) === 'seen' ? 'text-sky-200' : 'text-indigo-100/90'
                          }`}
                          title={getDeliveryState(message)}
                        >
                          {getDeliveryState(message) === 'sent' ? <Check size={12} /> : <CheckCheck size={12} />}
                        </span>
                      )}
                    </div>
                  </div>

                  {groupedReactions.length > 0 && (
                    <div className={`mt-1 flex flex-wrap gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {groupedReactions.map((reaction) => {
                        const reactedByMe = reaction.userIds.includes(String(currentUserId));

                        return (
                          <button
                            key={reaction.emoji}
                            type="button"
                            onClick={() => onReactToMessage(message._id, reaction.emoji)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs shadow-sm ${
                              reactedByMe
                                ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-200'
                                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <span>{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
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
        ref={composerRef}
        className="relative border-t border-slate-200/80 bg-white px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:px-4 dark:border-slate-700/80 dark:bg-slate-900"
        onSubmit={sendMessage}
      >
        {showPicker && (
          <div className="emoji-picker-popup absolute bottom-24 left-3 z-[70] max-w-[calc(100vw-2rem)] animate-fadeIn overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/15 md:left-4">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              lazyLoadEmojis
              searchDisabled={false}
              skinTonesDisabled
              width="min(352px, calc(100vw - 2rem))"
              height={380}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        {composerMode && (
          <div className="mb-2 flex items-start justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 px-3 py-2 text-sm text-brand-800 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-100">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]">
                {composerMode.icon}
                <span>{composerMode.label}</span>
              </div>
              <p className="mt-1 text-xs font-semibold">{composerMode.sender}</p>
              <p className="truncate text-sm">{composerMode.text}</p>
            </div>
            <button
              type="button"
              onClick={onCancelComposerAction}
              className="rounded-lg p-1 text-brand-700 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-brand-900/30"
              aria-label="Cancel composer action"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className={`kura-icon-btn ${showPicker ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/60 dark:bg-slate-800 dark:text-brand-200' : ''}`}
            aria-label="Open emoji picker"
            aria-expanded={showPicker}
            onClick={(event) => {
              event.stopPropagation();
              setShowPicker((prev) => !prev);
            }}
          >
            <Smile size={18} />
          </button>
          <label className={`kura-icon-btn ${canMessage ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} aria-label="upload">
            <ImagePlus size={18} />
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip"
              className="hidden"
              onChange={onUpload}
              disabled={!canMessage}
            />
          </label>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setTyping(Boolean(e.target.value));
            }}
            className="kura-input flex-1 py-2.5"
            placeholder={
              canMessage
                ? editingMessage
                  ? 'Edit your message...'
                  : 'Write a message...'
                : blockedMessage
            }
            disabled={!canMessage}
          />
          <button
            type="submit"
            disabled={!canMessage}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 p-2.5 text-white shadow-lg shadow-indigo-200/60 hover:-translate-y-0.5 hover:shadow-xl dark:shadow-indigo-900/30"
            aria-label={editingMessage ? 'save edit' : 'send'}
          >
            {editingMessage ? <Check size={18} /> : <SendHorizontal size={18} />}
          </button>
        </div>
      </form>
      {openMenuId && (() => {
        const activeMessage = safeMessages.find((message) => message._id === openMenuId);

        if (!activeMessage) {
          return null;
        }

        const activeSenderId = typeof activeMessage.sender === 'object' ? activeMessage.sender?._id : activeMessage.sender;
        const isMine = String(activeSenderId) === String(currentUser?._id);
        const hasText = Boolean(activeMessage.text?.trim());

        return createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex gap-1">
              {REACTION_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReactToMessage(activeMessage._id, emoji);
                    setOpenMenuId(null);
                  }}
                  className="flex-1 rounded-xl bg-slate-50 px-2 py-2 text-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                onReplyToMessage(activeMessage);
                setOpenMenuId(null);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <CornerUpLeft size={15} /> Reply
            </button>
            {isMine && hasText && (
              <button
                type="button"
                onClick={() => {
                  onStartEditMessage(activeMessage);
                  setOpenMenuId(null);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Pencil size={15} /> Edit
              </button>
            )}
            {isMine && (
              <button
                type="button"
                onClick={() => {
                  onDeleteMessage(activeMessage._id);
                  setOpenMenuId(null);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 size={15} /> Unsend
              </button>
            )}
          </div>,
          document.body
        );
      })()}
    </section>
  );
};

export default ChatArea;
