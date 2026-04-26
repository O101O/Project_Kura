import Conversation from '../models/Conversation.js';

const buildPreview = (message) => {
  if (!message) {
    return '';
  }
  if (message.text?.trim()) {
    return message.text.trim();
  }
  if (message.image || (message.attachmentType || '').startsWith('image/')) {
    return 'Shared an image';
  }
  if (message.attachmentName) {
    return message.attachmentName;
  }
  if (message.attachmentUrl) {
    return 'Shared an attachment';
  }
  return 'New message';
};

export const upsertDirectConversation = async ({
  ownerId,
  peerUserId,
  message,
  unreadDelta = 0,
  resetUnread = false
}) => {
  if (!ownerId || !peerUserId) {
    return;
  }

  const update = {
    $set: {
      lastMessage: message?._id || null,
      lastSender: message?.sender || null,
      lastPreview: buildPreview(message),
      lastAt: message?.createdAt || new Date()
    },
    $setOnInsert: {
      owner: ownerId,
      type: 'direct',
      peerUser: peerUserId,
      isStarred: false
    }
  };

  if (resetUnread) {
    update.$set.unreadCount = 0;
  } else if (unreadDelta > 0) {
    update.$inc = { unreadCount: unreadDelta };
  }

  await Conversation.updateOne(
    { owner: ownerId, type: 'direct', peerUser: peerUserId },
    update,
    { upsert: true }
  );
};

export const upsertGroupConversations = async ({ groupId, memberIds, senderId, message }) => {
  if (!groupId || !Array.isArray(memberIds) || memberIds.length === 0) {
    return;
  }

  const operations = memberIds.map((memberId) => ({
    updateOne: {
      filter: { owner: memberId, type: 'group', group: groupId },
      update: {
        $set: {
          lastMessage: message?._id || null,
          lastSender: message?.sender || null,
          lastPreview: buildPreview(message),
          lastAt: message?.createdAt || new Date(),
          ...(String(memberId) === String(senderId) ? { unreadCount: 0 } : {})
        },
        $setOnInsert: {
          owner: memberId,
          type: 'group',
          group: groupId,
          isStarred: false
        },
        ...(String(memberId) === String(senderId) ? {} : { $inc: { unreadCount: 1 } })
      },
      upsert: true
    }
  }));

  await Conversation.bulkWrite(operations, { ordered: false });
};

export const markConversationRead = async ({ ownerId, conversationId }) => {
  if (!ownerId || !conversationId) {
    return null;
  }

  return Conversation.findOneAndUpdate(
    { _id: conversationId, owner: ownerId },
    { $set: { unreadCount: 0 } },
    { new: true }
  );
};
