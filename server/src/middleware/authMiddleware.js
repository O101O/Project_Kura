import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader?.startsWith('Bearer ') ? tokenHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: invalid token' });
  }
};
