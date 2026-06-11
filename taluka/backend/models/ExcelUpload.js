const mongoose = require('mongoose');

const excelUploadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    default: ''
  },
  totalRows: {
    type: Number,
    default: 0
  },
  importedRows: {
    type: Number,
    default: 0
  },
  skippedRows: {
    type: Number,
    default: 0
  },
  batchId: {
    type: String,
    default: ''
  },
  // First 10 rows stored for instant preview — no re-parsing needed
  previewData: [
    {
      type:        { type: String, default: '' },
      villageName: { type: String, default: '' },
      amount:      { type: Number, default: 0  },
      year:        { type: Number, default: 0  },
      month:       { type: Number, default: 0  },
      date:        { type: String, default: '' }
    }
  ],
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExcelUpload', excelUploadSchema);