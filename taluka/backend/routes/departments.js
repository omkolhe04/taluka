const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Department = require('../models/Department');
const User = require('../models/User');

// GET /api/departments
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).populate('headId', 'name email');
    // Get employee count per dept
    const depts = await Promise.all(departments.map(async (dept) => {
      const empCount = await User.countDocuments({ departmentId: dept._id, role: 'Employee' });
      return { ...dept.toJSON(), employeeCount: empCount };
    }));
    res.json({ success: true, data: depts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/departments
router.post('/', protect, authorize('BDO'), async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept, message: 'Department created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/departments/:id
router.put('/:id', protect, authorize('BDO'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept, message: 'Department updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', protect, authorize('BDO'), async (req, res) => {
  try {
    await Department.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
