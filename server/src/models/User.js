/**
 * User model - Defines the schema for user accounts in the database.
 * Includes authentication, profile, and social features.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 30,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    resetToken: {
      type: String,
      select: false
    },
    resetTokenExpire: {
      type: Date,
      select: false
    },
    profilePic: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: 'Hey there! I am using Kura.',
      maxlength: 200
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'invisible'],
      default: 'online'
    },
    notifications: {
      messages: {
        type: Boolean,
        default: true
      },
      sounds: {
        type: Boolean,
        default: true
      },
      friendRequests: {
        type: Boolean,
        default: true
      }
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    friendRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    sentRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    mutedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    starredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

export default mongoose.model('User', userSchema);
