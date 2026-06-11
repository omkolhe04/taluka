const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  aadhaarNumber: {
    type: String,
    required: [true, 'Aadhaar number is required'],
    trim: true
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true
  },
  medium: {
    type: String,
    required: [true, 'Medium is required'],
    enum: ['Marathi', 'English', 'Hindi', 'Semi-English', 'Urdu', 'Other'],
    default: 'Marathi'
  },
  profileImage: {
    type: String,
    default: null
  },
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: [true, 'Village is required']
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College is required']
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

module.exports = mongoose.model('Student', studentSchema);
