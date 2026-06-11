const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Revenue  = require('../models/Revenue');
const { Notification } = require('../models/index');

// ── GET /api/revenue/village-summary ─────────────────────────────────────────
// Aggregated per-village summary: { villageName, totalAmount, totalDue, totalEntries }
// MUST be defined BEFORE /:id routes

router.get('/village-summary', protect, async (req, res) => {
  try {
    const summary = await Revenue.aggregate([
      {
        $group: {
          _id:          '$villageName',
          totalAmount:  { $sum: '$amount' },
          totalDue:     { $sum: '$dueAmount' },
          totalEntries: { $sum: 1 }
        }
      },
      {
        $project: {
          _id:          0,
          villageName:  '$_id',
          totalAmount:  1,
          totalDue:     1,
          totalEntries: 1
        }
      },
      { $sort: { villageName: 1 } }
    ]);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/revenue/villages ─────────────────────────────────────────────────
// Distinct village name strings

router.get('/villages', protect, async (req, res) => {
  try {
    const names = await Revenue.distinct('villageName');
    res.json({ success: true, data: names.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/revenue ─────────────────────────────────────────────────────────
// Raw records with optional filters: villageName, year, month, type

router.get('/', protect, async (req, res) => {
  try {
    const { villageName, year, month, type } = req.query;
    const filter = {};
    if (villageName) filter.villageName = villageName.toLowerCase().trim();
    if (year)        filter.year        = parseInt(year);
    if (month)       filter.month       = parseInt(month);
    if (type)        filter.type        = { $regex: type, $options: 'i' };

    const records = await Revenue.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.json({ success: true, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/revenue/:id ─────────────────────────────────────────────────────

router.put('/:id', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const allowed = ['dueAmount', 'type', 'amount', 'year', 'month', 'date'];
    const update  = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const doc = await Revenue.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: doc, message: 'Record updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/revenue/:id ───────────────────────────────────────────────────

router.delete('/:id', protect, authorize('BDO'), async (req, res) => {
  try {
    await Revenue.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/revenue/notify ─────────────────────────────────────────────────

router.post('/notify', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const { villageName, type, month, year, dueAmount, message } = req.body;
    if (!villageName || !type || !message) {
      return res.status(400).json({ success: false, message: 'villageName, type and message are required' });
    }
    const notif = await Notification.create({
      title:         `Due Amount Alert — ${villageName}`,
      message,
      type:          'warning',
      targetRole:    'DataEntry',
      relatedModule: 'revenue',
      status:        'unread'
    });
    res.status(201).json({
      success: true,
      message: `Notification sent to DataEntry for ${villageName} — ${type}`,
      data:    notif
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
