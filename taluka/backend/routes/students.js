const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { protect, authorize } = require('../middleware/auth');
const Student  = require('../models/Student');

// ── Multer setup ──────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads/students');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `student_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WEBP images are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

// ── Aadhaar masking helper ────────────────────────────────────
// Stores only last 4 digits visible: XXXX-XXXX-1234
function maskAadhaar(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 12) return raw; // pass through if invalid
  return `XXXX-XXXX-${digits.slice(8)}`;
}

// ── GET /api/students?collegeId=xxx&villageId=xxx ─────────────
// All roles — view students
router.get('/', protect, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.collegeId) filter.collegeId = req.query.collegeId;
    if (req.query.villageId) filter.villageId = req.query.villageId;

    const students = await Student.find(filter)
      .populate('villageId', 'name')
      .populate('collegeId', 'name')
      .populate('createdBy', 'name')
      .sort({ name: 1 });

    res.json({ success: true, data: students, count: students.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/students/:id ─────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('villageId', 'name taluka')
      .populate('collegeId', 'name')
      .populate('createdBy', 'name');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/students ────────────────────────────────────────
// BDO, DeptHead, DataEntry — add student
router.post('/', protect, authorize('BDO', 'DeptHead', 'DataEntry'),
  upload.single('profileImage'),
  async (req, res) => {
    try {
      const { name, aadhaarNumber, class: studentClass, medium, villageId, collegeId } = req.body;

      // Required field validation
      const missing = [];
      if (!name || !name.trim())            missing.push('Name');
      if (!aadhaarNumber || !aadhaarNumber.trim()) missing.push('Aadhaar Number');
      if (!studentClass || !studentClass.trim())   missing.push('Class');
      if (!medium)                          missing.push('Medium');
      if (!villageId)                       missing.push('Village');
      if (!collegeId)                       missing.push('College');

      if (missing.length) {
        // Clean up uploaded file if validation fails
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ success: false, message: `Required: ${missing.join(', ')}` });
      }

      // Validate Aadhaar (12 digits)
      const aadhaarDigits = aadhaarNumber.replace(/\D/g, '');
      if (aadhaarDigits.length !== 12) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ success: false, message: 'Aadhaar must be exactly 12 digits' });
      }

      const profileImage = req.file
        ? `/uploads/students/${req.file.filename}`
        : null;

      const student = await Student.create({
        name:          name.trim(),
        aadhaarNumber: maskAadhaar(aadhaarNumber),
        class:         studentClass.trim(),
        medium,
        profileImage,
        villageId,
        collegeId,
        createdBy: req.user._id
      });

      const populated = await Student.findById(student._id)
        .populate('villageId', 'name')
        .populate('collegeId', 'name')
        .populate('createdBy', 'name');

      res.status(201).json({ success: true, data: populated, message: `Student "${student.name}" added successfully` });
    } catch (err) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── PUT /api/students/:id ─────────────────────────────────────
// BDO, DeptHead, DataEntry — edit student
router.put('/:id', protect, authorize('BDO', 'DeptHead', 'DataEntry'),
  upload.single('profileImage'),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const { name, aadhaarNumber, class: studentClass, medium, villageId, collegeId } = req.body;
      const update = {};

      if (name !== undefined)         update.name      = name.trim();
      if (studentClass !== undefined) update.class     = studentClass.trim();
      if (medium !== undefined)       update.medium    = medium;
      if (villageId !== undefined)    update.villageId = villageId;
      if (collegeId !== undefined)    update.collegeId = collegeId;

      if (aadhaarNumber !== undefined) {
        const digits = aadhaarNumber.replace(/\D/g, '');
        if (digits.length !== 12 && !aadhaarNumber.startsWith('XXXX')) {
          if (req.file) fs.unlink(req.file.path, () => {});
          return res.status(400).json({ success: false, message: 'Aadhaar must be exactly 12 digits' });
        }
        update.aadhaarNumber = aadhaarNumber.startsWith('XXXX')
          ? aadhaarNumber  // already masked — keep as-is
          : maskAadhaar(aadhaarNumber);
      }

      if (req.file) {
        // Delete old image
        if (student.profileImage) {
          const oldPath = path.join(__dirname, '../..', student.profileImage);
          fs.unlink(oldPath, () => {});
        }
        update.profileImage = `/uploads/students/${req.file.filename}`;
      }

      const updated = await Student.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
        .populate('villageId', 'name')
        .populate('collegeId', 'name')
        .populate('createdBy', 'name');

      res.json({ success: true, data: updated, message: 'Student updated successfully' });
    } catch (err) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── DELETE /api/students/:id ──────────────────────────────────
// BDO only — soft delete
router.delete('/:id', protect, authorize('BDO'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: `Student "${student.name}" deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
