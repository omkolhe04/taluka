const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Revenue = require('../models/Revenue');
const KYC = require('../models/KYC');
const { Bill, EmployeeLog } = require('../models/index');

router.get('/revenue-trends', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const trends = await Revenue.aggregate([
      { $match: { year } },
      { $group: { _id: '$month', total: { $sum: '$amount' }, paid: { $sum: { $cond: [{ $eq: ['$status','paid'] }, '$amount', 0] } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = months.map((m, i) => { const found = trends.find(t => t._id === i+1); return { month: m, total: found?.total||0, paid: found?.paid||0, count: found?.count||0 }; });
    res.json({ success: true, data });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/kyc-stats', protect, async (req, res) => {
  try {
    const stats = await KYC.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const modeStats = await KYC.aggregate([
      { $group: { _id: '$mode', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { statusStats: stats, modeStats } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/employee-productivity', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const logs = await EmployeeLog.aggregate([
      { $group: { _id: '$employeeId', totalLogins: { $sum: 1 }, totalKyc: { $sum: '$kycCompleted' }, totalVerifications: { $sum: '$verificationsCompleted' }, totalRevenue: { $sum: '$revenueCollected' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmpty: true } },
      { $project: { name: '$user.name', role: '$user.role', totalLogins: 1, totalKyc: 1, totalVerifications: 1, totalRevenue: 1 } }
    ]);
    res.json({ success: true, data: logs });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/bill-summary', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const stats = await Bill.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$price' } } }]);
    res.json({ success: true, data: stats });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
