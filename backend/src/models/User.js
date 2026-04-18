const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [
      function () { return !this.googleId && !this.is_guest; },
      'Password is required'
    ],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  googleId: { type: String, sparse: true, unique: true },
  farm_location: {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    lat: { type: Number },
    lon: { type: Number },
  },
  phone: { type: String, trim: true },
  isPhoneVerified: { type: Boolean, default: false },
  farm_size_acres: { type: Number },
  crop_types: [{ type: String }],
  avatar: { type: String },
  plan: { type: String, enum: ['free', 'kisan_basic', 'kisan_pro'], default: 'free' },
  is_active: { type: Boolean, default: true },
  is_guest: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
