import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const replySchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    text: {
      type: String,
      default: ''
    },
    sender: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },
    text: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    attachmentUrl: {
      type: String,
      default: ''
    },
    attachmentType: {
      type: String,
      default: ''
    },
    attachmentName: {
      type: String,
      default: ''
    },
    reactions: {
      type: [reactionSchema],
      default: []
    },
    replyTo: {
      type: replySchema,
      default: null
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    seen: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ groupId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
