const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/crypto');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['admin', 'client', 'driver'],
      default: 'client',
    },
    password: {
      type: String,
      required: false,
      minlength: [8, 'Password must be at least 8 characters'],
      validate: {
        validator: function (v) {
          if (!v) return true;
          // If the password starts with $2a$ or $2b$, it is a bcrypt hash (e.g. from seed/admin creation)
          if (v && (v.startsWith('$2a$') || v.startsWith('$2b$'))) {
            return true;
          }
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/.test(v);
        },
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.',
      },
      select: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    vehicleNumber: String,
    licenseNumber: String,
    rcDocument: String,
    licenseDocument: String,
    aadhaarDocument: String,
    panDocument: String,
    profilePicture: String,
    currentCity: String,
    vehicleModelYear: String,
    aadhaarNumber: {
      type: String,
      set: encrypt,
      get: decrypt,
    },
    driverNameIfVendor: String,
    driverContactNumber: String,
    rcCopyAvailable: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    insuranceValidTill: String,
    preferredServiceArea: String,
    previousExperience: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: Date,
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      lastUpdated: { type: Date, default: null }
    },
    walletBalance: {
      type: Number,
      default: 1500.00
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Add compound indexes for authentication and admin query optimization
userSchema.index({ email: 1, role: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
