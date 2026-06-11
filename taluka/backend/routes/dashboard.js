const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Revenue = require('../models/Revenue');
const KYC = require('../models/KYC');
const { Notification, Bill, FieldVerification } = require('../models/index');
const User = require('../models/User');
const Village = require('../models/Village');

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const [
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalKyc,
      approvedKyc,
      pendingKyc,
      totalBills,
      suspiciousBills,
      unreadNotifications,
      totalEmployees,
      totalVillages,
      pendingVerifications
    ] = await Promise.all([
      Revenue.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Revenue.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Revenue.countDocuments({ status: 'pending' }),
      KYC.countDocuments(),
      KYC.countDocuments({ status: 'approved' }),
      KYC.countDocuments({ status: 'pending' }),
      Bill.countDocuments(),
      Bill.countDocuments({ isSuspicious: true }),
      Notification.countDocuments({ status: 'unread', $or: [{ targetRole: req.user.role }, { targetRole: 'all' }] }),
      User.countDocuments({ role: 'Employee' }),
      Village.countDocuments(),
      FieldVerification.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue[0]?.total || 0,
          paid: paidRevenue[0]?.total || 0,
          pendingCount: pendingRevenue
        },
        kyc: {
          total: totalKyc,
          approved: approvedKyc,
          pending: pendingKyc,
          completionRate: totalKyc > 0 ? Math.round((approvedKyc / totalKyc) * 100) : 0
        },
        bills: {
          total: totalBills,
          suspicious: suspiciousBills
        },
        notifications: unreadNotifications,
        employees: totalEmployees,
        villages: totalVillages,
        verifications: pendingVerifications
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', protect, async (req, res) => {
  try {
    const recentKyc = await KYC.find().sort({ createdAt: -1 }).limit(5).populate('villageId', 'name').populate('submittedBy', 'name');
    const recentRevenue = await Revenue.find().sort({ createdAt: -1 }).limit(5).populate('villageId', 'name').populate('collectedBy', 'name');

    res.json({
      success: true,
      data: {
        recentKyc,
        recentRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
