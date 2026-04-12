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

export const upsertDirectConversation = async ({ ownerId, peerUserId, message }) => {
  if (!ownerId || !peerUserId) {
    return;
  }

  await Conversation.updateOne(
    { owner: ownerId, type: 'direct', peerUser: peerUserId },
    {
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
    },
    { upsert: true }
  );
};

export const upsertGroupConversations = async ({ groupId, memberIds, message }) => {
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
          lastAt: message?.createdAt || new Date()
        },
        $setOnInsert: {
          owner: memberId,
          type: 'group',
          group: groupId,
          isStarred: false
        }
      },
      upsert: true
    }
  }));

  await Conversation.bulkWrite(operations, { ordered: false });
};
