const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');

// ─── POST /api/auth/signup ───────────────────────────────
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { name, email, password, farm_location, phone, farm_size_acres, crop_types } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      farm_location,
      phone,
      farm_size_acres,
      crop_types,
    });

    const token = signToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[SIGNUP ERROR]', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// ─── POST /api/auth/login ────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid email or password format' });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated. Contact support.' });
    }

    const token = signToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// ─── PUT /api/auth/profile ───────────────────────────────
router.put('/profile', protect, async (req, res) => {
  const { name, phone, farm_location, farm_size_acres, crop_types } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, farm_location, farm_size_acres, crop_types },
      { new: true, runValidators: true }
    );
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ─── PUT /api/auth/password ──────────────────────────────
router.put('/password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password update failed' });
  }
});

module.exports = router;
