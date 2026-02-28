/**
 * Authentication API routes
 * POST /api/auth/register  — Create new account
 * POST /api/auth/login     — Authenticate with username + password
 * POST /api/auth/logout    — Clear session
 * POST /api/auth/password  — Change password (authenticated)
 * GET  /api/auth/me        — Get current user info
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = require('../db');
const { authMiddleware, generateToken, setSessionCookie, clearSessionCookie } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 60 * 1000;

// Prepared statements
const findUser = db.prepare('SELECT * FROM users WHERE username = ?');
const findUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const insertUser = db.prepare(`
  INSERT INTO users (id, username, display_name, password_hash)
  VALUES (?, ?, ?, ?)
`);
const updateFailedAttempts = db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?');
const resetFailedAttempts = db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?');
const updatePassword = db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`);

// ─── REGISTER ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, displayName, password } = req.body;

    if (!username || !displayName || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const uname = username.toLowerCase().trim();

    if (uname.length < 3 || uname.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters.' });
    }
    if (!/^[a-z0-9_]+$/.test(uname)) {
      return res.status(400).json({ error: 'Username: letters, numbers, and underscores only.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (displayName.trim().length < 1 || displayName.trim().length > 100) {
      return res.status(400).json({ error: 'Display name must be 1-100 characters.' });
    }

    const existing = findUser.get(uname);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const id = uuidv4();

    insertUser.run(id, uname, displayName.trim(), hash);
    logAudit(id, 'REGISTER', `User ${uname} registered`, req.ip);

    // Auto-login after registration
    const token = generateToken({ id, username: uname });
    setSessionCookie(res, token);

    res.status(201).json({
      user: { id, username: uname, displayName: displayName.trim() },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const uname = username.toLowerCase().trim();
    const user = findUser.get(uname);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 1000);
      logAudit(user.id, 'LOGIN_LOCKED', `Account locked, ${remaining}s remaining`, req.ip);
      return res.status(429).json({
        error: `Account locked. Try again in ${remaining} seconds.`,
        lockedSeconds: remaining,
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = (user.failed_attempts || 0) + 1;
      let lockedUntil = null;
      if (attempts >= LOCKOUT_THRESHOLD) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
      }
      updateFailedAttempts.run(attempts, lockedUntil, user.id);
      logAudit(user.id, 'LOGIN_FAILED', `Failed attempt ${attempts}`, req.ip);

      const remaining = LOCKOUT_THRESHOLD - attempts;
      if (remaining <= 0) {
        return res.status(429).json({ error: 'Too many failed attempts. Account locked for 60 seconds.', lockedSeconds: 60 });
      }
      return res.status(401).json({ error: `Invalid password. ${remaining} attempt(s) remaining.` });
    }

    // Success — reset failed attempts and issue session
    resetFailedAttempts.run(user.id);
    const token = generateToken(user);
    setSessionCookie(res, token);
    logAudit(user.id, 'LOGIN_SUCCESS', null, req.ip);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  const token = req.cookies?.[process.env.COOKIE_NAME || 'hv_session'];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CHANGE_ME');
      logAudit(decoded.id, 'LOGOUT', null, req.ip);
    } catch {}
  }
  clearSessionCookie(res);
  res.json({ message: 'Signed out.' });
});

// ─── CHANGE PASSWORD ─────────────────────────────────────────
router.post('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = findUserById.get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      logAudit(user.id, 'PASSWORD_CHANGE_FAILED', 'Wrong current password', req.ip);
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    updatePassword.run(newHash, user.id);
    logAudit(user.id, 'PASSWORD_CHANGED', null, req.ip);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ─── GET CURRENT USER ─────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const user = findUserById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    createdAt: user.created_at,
  });
});

module.exports = router;
