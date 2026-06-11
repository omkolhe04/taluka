const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Bill, Notification } = require('../models/index');
const upload = require('../middleware/upload');

const MARKET_PRICES = { 'Construction': 5000, 'Equipment': 15000, 'Stationery': 500, 'Transport': 3000, 'Food': 1000, 'General': 2000 };

router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const bills = await Bill.find(filter).populate('submittedBy', 'name').populate('reviewedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/', protect, (req, res, next) => { req.uploadSubDir = 'bills'; next(); }, upload.single('image'), async (req, res) => {
  try {
    const { price, marketPrice, category, title, vendor } = req.body;
    const billPrice = parseFloat(price);
    const mktPrice = parseFloat(marketPrice) || MARKET_PRICES[category] || MARKET_PRICES['General'];
    const isSuspicious = billPrice > mktPrice * 1.2;
    const bill = await Bill.create({
      title, vendor, category, price: billPrice, marketPrice: mktPrice,
      isSuspicious, status: isSuspicious ? 'suspicious' : 'pending',
      suspiciousReason: isSuspicious ? `Bill (₹${billPrice}) exceeds market price (₹${mktPrice}) by more than 20%` : '',
      submittedBy: req.user._id,
      image: req.file ? `/uploads/bills/${req.file.filename}` : null
    });
    if (isSuspicious) {
      await Notification.create({ title: 'Suspicious Bill Detected', message: `Bill "${title}" flagged: ₹${billPrice} vs market ₹${mktPrice}`, type: 'warning', targetRole: 'BDO', relatedModule: 'bill', relatedId: bill._id });
    }
    res.status(201).json({ success: true, data: bill, message: isSuspicious ? 'Bill submitted but flagged as suspicious' : 'Bill submitted successfully' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id/approve', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date(), remarks: req.body.remarks || '' }, { new: true });
    res.json({ success: true, data: bill, message: 'Bill approved' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id/reject', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), remarks: req.body.remarks || '' }, { new: true });
    res.json({ success: true, data: bill, message: 'Bill rejected' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
