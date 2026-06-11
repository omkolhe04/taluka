const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'College name is required'],
    trim: true
  },
  nameLower: {
    type: String,
    trim: true,
    lowercase: true
  },
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: [true, 'Village is required']
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

collegeSchema.pre('save', function (next) {
  this.nameLower = this.name.trim().toLowerCase();
  next();
});

module.exports = mongoose.model('College', collegeSchema);
