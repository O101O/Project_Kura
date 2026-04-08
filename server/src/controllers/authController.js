import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getClientUrl } from '../config/env.js';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { uploadImageBuffer } from '../utils/uploadImage.js';

const mapUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  profilePic: user.profilePic,
  bio: user.bio,
  status: user.status,
  notifications: user.notifications,
  friends: user.friends,
  friendRequests: user.friendRequests,
  sentRequests: user.sentRequests,
  mutedUsers: user.mutedUsers,
  blockedUsers: user.blockedUsers,
  createdAt: user.createdAt
});

export const register = async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    let profilePic = '';
    if (req.file) {
      try {
        profilePic = await uploadImageBuffer(req.file.buffer);
      } catch (uploadError) {
        if (uploadError.code === 'CLOUDINARY_NOT_CONFIGURED') {
          return res.status(503).json({ message: 'Image upload is not configured. Add Cloudinary API keys.' });
        }
        if (uploadError.code === 'CLOUDINARY_UPLOAD_FAILED') {
          return res.status(502).json({ message: 'Failed to upload profile image. Please try again.' });
        }
        throw uploadError;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      profilePic
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: mapUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: mapUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+resetToken +resetTokenExpire');

    if (!user) {
      return res.status(200).json({
        message: 'If this email exists, a reset link has been generated'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const clientUrl = getClientUrl();
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    return res.status(200).json({
      // Demo Mode: In production, this link should be sent via email
      message: 'Reset link generated (Demo Mode)',
      resetUrl
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: new Date() }
    }).select('+password +resetToken +resetTokenExpire');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};
