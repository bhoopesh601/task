import { verifyToken } from '../lib/auth.js';

/**
 * Authentication Middleware
 * Protects backend routes by verifying JWT in cookies or Bearer Authorization header.
 */
export const requireAuth = (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = decoded; // { userId, email }
  next();
};
