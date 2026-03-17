const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { protect, signToken } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// ─── POST /api/auth/google ───────────────────────────────
router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential token required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { credential } = req.body;

  try {
    let email, name, googleId, picture;

    // Try verifying as ID token first, then fall back to access token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ error: 'Invalid Google token' });
      }
      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
      picture = payload.picture;
    } catch {
      // Treat credential as an access_token and fetch user info from Google
      const axios = require('axios');
      const { data: userInfo } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` },
      });
      if (!userInfo || !userInfo.email) {
        return res.status(400).json({ error: 'Invalid Google token' });
      }
      email = userInfo.email;
      name = userInfo.name;
      googleId = userInfo.sub;
      picture = userInfo.picture;
    }

    let user = await User.findOne({ email });

    if (user) {
      // If user exists, update googleId and avatar if not present
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = user.avatar || picture;
        await user.save();
      }
    } else {
      // Create new user for Google login
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
      });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated. Contact support.' });
    }

    const token = signToken(user._id);

    res.json({
      message: 'Google Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[GOOGLE LOGIN ERROR]', err);
    res.status(500).json({ error: 'Google login failed' });
  }
});

// ─── POST /api/auth/send-otp ─────────────────────────────
router.post('/send-otp', [
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { phone } = req.body;

  try {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real scenario, you'd integrate Twilio/SNS here
    console.log(`\n============================`);
    console.log(`[MOCK SMS] OTP for ${phone}: ${otpCode}`);
    console.log(`============================\n`);

    // Remove any existing OTP for this phone number
    await OTP.deleteMany({ phone });

    // Save new OTP
    await OTP.create({ phone, otp: otpCode });

    res.json({ message: 'OTP sent successfully (Check console)' });
  } catch (err) {
    console.error('[SEND OTP ERROR]', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ─── POST /api/auth/verify-otp ───────────────────────────
router.post('/verify-otp', protect, [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { phone, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ phone, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark user's phone as verified
    await User.findByIdAndUpdate(req.user._id, {
      phone,
      isPhoneVerified: true
    });

    // Delete OTP record since it's used
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ message: 'Phone number verified successfully' });
  } catch (err) {
    console.error('[VERIFY OTP ERROR]', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;
