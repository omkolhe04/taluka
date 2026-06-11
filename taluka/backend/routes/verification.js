const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { FieldVerification, Notification } = require('../models/index');
const upload = require('../middleware/upload');

router.get('/', protect, async (req, res) => {
  try {
    const { status, villageId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (villageId) filter.villageId = villageId;
    if (req.user.role === 'Employee') filter.submittedBy = req.user._id;
    const verifications = await FieldVerification.find(filter)
      .populate('villageId', 'name taluka').populate('submittedBy', 'name').populate('verifiedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: verifications });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/', protect, (req, res, next) => { req.uploadSubDir = 'verifications'; next(); }, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body, submittedBy: req.user._id, image: req.file ? `/uploads/verifications/${req.file.filename}` : null };
    if (req.body.latitude) data.latitude = parseFloat(req.body.latitude);
    if (req.body.longitude) data.longitude = parseFloat(req.body.longitude);
    const verification = await FieldVerification.create(data);
    await Notification.create({ title: 'New Field Verification', message: `Field verification submitted: ${verification.title}`, type: 'info', targetRole: 'BDO', relatedModule: 'verification', relatedId: verification._id });
    res.status(201).json({ success: true, data: verification, message: 'Verification submitted' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id/verify', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const v = await FieldVerification.findByIdAndUpdate(req.params.id, { status: 'verified', verifiedBy: req.user._id, verifiedAt: new Date() }, { new: true });
    if (!v) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: v, message: 'Verification approved' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id/reject', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const v = await FieldVerification.findByIdAndUpdate(req.params.id, { status: 'rejected', verifiedBy: req.user._id, verifiedAt: new Date() }, { new: true });
    res.json({ success: true, data: v, message: 'Verification rejected' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
