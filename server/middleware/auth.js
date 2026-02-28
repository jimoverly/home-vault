/**
 * Authentication middleware — verifies JWT from httpOnly cookie
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const COOKIE_NAME = process.env.COOKIE_NAME || 'hv_session';

function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username }
    next();
  } catch (err) {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '8h' }
  );
}

function setSessionCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

module.exports = { authMiddleware, generateToken, setSessionCookie, clearSessionCookie };
