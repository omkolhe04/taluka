const mongoose = require('mongoose');

// Raw per-row records imported from Excel
const revenueRecordSchema = new mongoose.Schema({
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: [true, 'Village is required']
  },
  type: {
    type: String,
    enum: ['Pani Patti', 'Ghar Patti', 'Land Revenue', 'Other'],
    required: [true, 'Revenue type is required']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  // If dueAmount > 0 → treated as pending
  status: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'pending'
  },
  payerName: {
    type: String,
    trim: true,
    default: ''
  },
  // Stored masked: XXXX-XXXX-XXXX
  payerAadhaar: {
    type: String,
    trim: true,
    default: ''
  },
  // Name of collector as string (from Excel cell)
  collectedBy: {
    type: String,
    trim: true,
    default: ''
  },
  // The DataEntry user who uploaded this record
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  month: {
    type: Number,
    default: () => new Date().getMonth() + 1
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Batch ID so all rows from one upload are linked
  uploadBatchId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for fast village + month + year queries
revenueRecordSchema.index({ villageId: 1, year: 1, month: 1 });
revenueRecordSchema.index({ uploadBatchId: 1 });

module.exports = mongoose.model('RevenueRecord', revenueRecordSchema);
