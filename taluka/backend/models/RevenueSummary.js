const mongoose = require('mongoose');

// Pre-aggregated summary: one doc per (villageId + type + month + year + collectedBy)
const revenueSummarySchema = new mongoose.Schema({
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: true
  },
  type: {
    type: String,
    enum: ['Pani Patti', 'Ghar Patti', 'Land Revenue', 'Other'],
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  // Name string from Excel (not ObjectId reference)
  collectedBy: {
    type: String,
    default: ''
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  totalDueAmount: {
    type: Number,
    default: 0
  },
  recordCount: {
    type: Number,
    default: 0
  },
  paidCount: {
    type: Number,
    default: 0
  },
  pendingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index: one summary doc per group
revenueSummarySchema.index(
  { villageId: 1, type: 1, month: 1, year: 1, collectedBy: 1 },
  { unique: true }
);

module.exports = mongoose.model('RevenueSummary', revenueSummarySchema);
