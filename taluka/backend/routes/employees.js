const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { EmployeeLog } = require('../models/index');

router.get('/', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const filter = { role: { $in: ['Employee', 'DataEntry', 'DeptHead'] } };
    if (req.user.role === 'DeptHead') filter.departmentId = req.user.departmentId;
    if (req.query.departmentId && req.user.role === 'BDO') filter.departmentId = req.query.departmentId;
    const employees = await User.find(filter).populate('departmentId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/logs', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const logs = await EmployeeLog.find().populate('employeeId', 'name email role').sort({ loginTime: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id', protect, authorize('BDO'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: 'Employee updated' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id/toggle-status', protect, authorize('BDO'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
