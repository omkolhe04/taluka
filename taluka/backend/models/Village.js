const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    unique: true
  },
  // Store lowercase version for case-insensitive matching
  nameLower: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true
  },
  taluka: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-set nameLower before every save
villageSchema.pre('save', function (next) {
  this.nameLower = this.name.trim().toLowerCase();
  next();
});

module.exports = mongoose.model('Village', villageSchema);
