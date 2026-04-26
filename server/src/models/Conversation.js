import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true
    },
    peerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    lastSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastPreview: {
      type: String,
      default: ''
    },
    lastAt: {
      type: Date,
      default: null
    },
    isStarred: {
      type: Boolean,
      default: false
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

conversationSchema.index(
  { owner: 1, type: 1, peerUser: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'direct', peerUser: { $type: 'objectId' } }
  }
);
conversationSchema.index(
  { owner: 1, type: 1, group: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'group', group: { $type: 'objectId' } }
  }
);

export default mongoose.model('Conversation', conversationSchema);
