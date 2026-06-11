const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/auth');
const College  = require('../models/College');
const Student  = require('../models/Student');

// ── GET /api/colleges?villageId=xxx ───────────────────────────
// All roles — get colleges (optionally filtered by village)
router.get('/', protect, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.villageId) filter.villageId = req.query.villageId;

    const colleges = await College.find(filter)
      .populate('villageId', 'name taluka')
      .populate('createdBy', 'name')
      .sort({ name: 1 });

    // Attach student count to each college
    const collegesWithCount = await Promise.all(
      colleges.map(async (c) => {
        const count = await Student.countDocuments({ collegeId: c._id, isActive: true });
        return { ...c.toObject(), studentCount: count };
      })
    );

    res.json({ success: true, data: collegesWithCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/colleges/:id ─────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const college = await College.findById(req.params.id)
      .populate('villageId', 'name taluka')
      .populate('createdBy', 'name');
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });
    res.json({ success: true, data: college });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/colleges ────────────────────────────────────────
// BDO & DeptHead only — create college
router.post('/', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const { name, villageId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'College name is required' });
    }
    if (!villageId) {
      return res.status(400).json({ success: false, message: 'Village is required' });
    }

    // Duplicate check within same village
    const exists = await College.findOne({
      nameLower: name.trim().toLowerCase(),
      villageId,
      isActive: true
    });
    if (exists) {
      return res.status(400).json({ success: false, message: `College "${name}" already exists in this village` });
    }

    const college = await College.create({
      name:      name.trim(),
      nameLower: name.trim().toLowerCase(),
      villageId,
      createdBy: req.user._id
    });

    const populated = await College.findById(college._id)
      .populate('villageId', 'name taluka')
      .populate('createdBy', 'name');

    res.status(201).json({ success: true, data: populated, message: `College "${college.name}" created` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/colleges/:id ─────────────────────────────────────
// BDO & DeptHead — edit college
router.put('/:id', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const { name, villageId } = req.body;
    const update = {};
    if (name !== undefined) {
      update.name      = name.trim();
      update.nameLower = name.trim().toLowerCase();
    }
    if (villageId !== undefined) update.villageId = villageId;

    const college = await College.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('villageId', 'name taluka')
      .populate('createdBy', 'name');

    if (!college) return res.status(404).json({ success: false, message: 'College not found' });
    res.json({ success: true, data: college, message: 'College updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/colleges/:id ──────────────────────────────────
// BDO only — soft delete
router.delete('/:id', protect, authorize('BDO'), async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });
    res.json({ success: true, message: `College "${college.name}" deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
