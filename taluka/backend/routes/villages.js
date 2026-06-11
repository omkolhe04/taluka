const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Village = require('../models/Village');

// ── GET /api/villages ─────────────────────────────────────────
// All roles can view active villages (needed for dropdowns)
router.get('/', protect, async (req, res) => {
  try {
    const villages = await Village.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ name: 1 });
    res.json({ success: true, data: villages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/villages ────────────────────────────────────────
// BDO ONLY — create village
router.post('/', protect, authorize('BDO'), async (req, res) => {
  try {
    const { name, taluka } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Village name is required' });
    }

    // Duplicate check (case-insensitive)
    const exists = await Village.findOne({ nameLower: name.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: `Village "${name}" already exists` });
    }

    const village = await Village.create({
      name:      name.trim(),
      nameLower: name.trim().toLowerCase(),
      taluka:    (taluka || '').trim(),
      createdBy: req.user._id
    });

    const populated = await Village.findById(village._id).populate('createdBy', 'name');
    res.status(201).json({ success: true, data: populated, message: `Village "${village.name}" created` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/villages/:id ─────────────────────────────────────
// BDO ONLY — edit village
router.put('/:id', protect, authorize('BDO'), async (req, res) => {
  try {
    const { name, taluka, isActive } = req.body;
    const update = {};
    if (name !== undefined)     { update.name = name.trim(); update.nameLower = name.trim().toLowerCase(); }
    if (taluka !== undefined)   update.taluka   = taluka.trim();
    if (isActive !== undefined) update.isActive = isActive;

    const village = await Village.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('createdBy', 'name');
    if (!village) return res.status(404).json({ success: false, message: 'Village not found' });
    res.json({ success: true, data: village, message: 'Village updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/villages/:id ──────────────────────────────────
// BDO ONLY — soft delete
router.delete('/:id', protect, authorize('BDO'), async (req, res) => {
  try {
    const village = await Village.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!village) return res.status(404).json({ success: false, message: 'Village not found' });
    res.json({ success: true, message: `Village "${village.name}" deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
