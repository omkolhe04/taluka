const mongoose = require('mongoose');

// Notification Schema
const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  title: {
    type: String,
    trim: true,
    default: 'System Notification'
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  targetRole: {
    type: String,
    enum: ['BDO', 'DeptHead', 'Employee', 'DataEntry', 'all'],
    default: 'all'
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['read', 'unread'],
    default: 'unread'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  relatedModule: {
    type: String,
    enum: ['revenue', 'kyc', 'verification', 'bill', 'department', 'general'],
    default: 'general'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true
});

// EmployeeLog Schema
const employeeLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  kycCompleted: {
    type: Number,
    default: 0
  },
  verificationsCompleted: {
    type: Number,
    default: 0
  },
  revenueCollected: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Bill Schema
const billSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: 'Bill Verification'
  },
  image: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: [true, 'Bill price is required'],
    min: [0, 'Price cannot be negative']
  },
  marketPrice: {
    type: Number,
    required: [true, 'Market price is required'],
    min: [0, 'Market price cannot be negative']
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  vendor: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspicious'],
    default: 'pending'
  },
  isSuspicious: {
    type: Boolean,
    default: false
  },
  suspiciousReason: {
    type: String,
    default: ''
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// FieldVerification Schema
const fieldVerificationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Title is required']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    default: null
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    default: null
  },
  relatedKycId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KYC',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
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
  }
}, {
  timestamps: true
});

module.exports = {
  Notification: mongoose.model('Notification', notificationSchema),
  EmployeeLog: mongoose.model('EmployeeLog', employeeLogSchema),
  Bill: mongoose.model('Bill', billSchema),
  FieldVerification: mongoose.model('FieldVerification', fieldVerificationSchema)
};
