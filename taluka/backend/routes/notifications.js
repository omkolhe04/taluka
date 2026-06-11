const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Notification } = require('../models/index');

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ targetRole: req.user.role }, { targetRole: 'all' }, { targetUser: req.user._id }]
    }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const notif = await Notification.create({ ...req.body });
    res.status(201).json({ success: true, data: notif, message: 'Notification created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, {
      status: 'read',
      $addToSet: { readBy: req.user._id }
    }, { new: true });
    res.json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ targetRole: req.user.role }, { targetRole: 'all' }], status: 'unread' },
      { status: 'read', $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
