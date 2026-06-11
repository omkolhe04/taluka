const mongoose = require('mongoose');

// New simplified schema — one row per Excel entry, no aggregation
const revenueSchema = new mongoose.Schema({
  villageName: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    lowercase: true   // normalise: "Dehu" / "DEHU" / "dehu" all → "dehu"
  },
  type: {
    type: String,
    required: [true, 'Revenue type is required'],
    trim: true        // free-form from Excel, e.g. "pani patti", "ghar patti"
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  dueAmount: {
    type: Number,
    default: 0   // stays 0 until BDO explicitly edits it
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  date: {
    type: String,   // stored as string "10" or full date — flexible
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  uploadBatchId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

revenueSchema.index({ villageName: 1, year: 1, month: 1 });

module.exports = mongoose.model('Revenue', revenueSchema);
