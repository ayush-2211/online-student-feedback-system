const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticate, asyncHandler } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, usn: u.usn });

// POST /api/auth/register  -> students self-register
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, usn, password } = req.body;

  if (!name || !email || !usn || !password) {
    return res.status(400).json({ message: 'Name, email, USN and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const clean = { name: name.trim(), email: email.trim().toLowerCase(), usn: usn.trim().toUpperCase() };
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, usn, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [clean.name, clean.email, clean.usn, hash, 'student']
    );
    const user = { id: result.insertId, role: 'student', ...clean };
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with this email or USN already exists.' });
    }
    throw err;
  }
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ message: 'Incorrect email or password.' });

  res.json({ token: signToken(user), user: publicUser(user) });
}));

// GET /api/auth/me  -> validates a stored token and returns the profile
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT id, name, email, usn, role FROM users WHERE id = ?', [req.user.id]);
  if (!rows[0]) return res.status(401).json({ message: 'Account no longer exists.' });
  res.json({ user: rows[0] });
}));

module.exports = router;
