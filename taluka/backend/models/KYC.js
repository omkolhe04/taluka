const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  aadhaar: {
    type: String,
    required: [true, 'Aadhaar number is required'],
    trim: true
  },
  aadhaarMasked: {
    type: String,
    trim: true
  },
  dob: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  mobile: {
    type: String,
    trim: true,
    default: ''
  },
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    default: null
  },
  mode: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  photo: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Mask Aadhaar before saving
kycSchema.pre('save', function(next) {
  if (this.isModified('aadhaar')) {
    const aadhaar = this.aadhaar.replace(/\s/g, '');
    this.aadhaarMasked = 'XXXX-XXXX-' + aadhaar.slice(-4);
  }
  next();
});

module.exports = mongoose.model('KYC', kycSchema);
