const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const KYC = require('../models/KYC');
const { Notification } = require('../models/index');

// Simulated OTP storage (in production use Redis)
const otpStore = new Map();

// Mock Aadhaar database
const mockAadhaarDB = {
  '123456789012': { name: 'Ramesh Kumar', dob: '1985-06-15', gender: 'Male', address: 'Village Pune, Maharashtra' },
  '234567890123': { name: 'Sunita Devi', dob: '1990-03-22', gender: 'Female', address: 'Village Nashik, Maharashtra' },
  '345678901234': { name: 'Prakash Patil', dob: '1978-11-08', gender: 'Male', address: 'Village Ahmednagar, Maharashtra' },
  '456789012345': { name: 'Lata Sharma', dob: '1995-07-30', gender: 'Female', address: 'Village Solapur, Maharashtra' },
};

// GET /api/kyc
router.get('/', protect, async (req, res) => {
  try {
    const { status, mode, villageId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (mode) filter.mode = mode;
    if (villageId) filter.villageId = villageId;

    const kycs = await KYC.find(filter)
      .populate('villageId', 'name taluka')
      .populate('submittedBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: kycs, count: kycs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/kyc/generate-otp (Simulated Online KYC)
router.post('/generate-otp', protect, async (req, res) => {
  try {
    const { aadhaar } = req.body;
    if (!aadhaar || aadhaar.length !== 12) {
      return res.status(400).json({ success: false, message: 'Valid 12-digit Aadhaar number required' });
    }

    // Check if Aadhaar exists in mock DB
    const citizenData = mockAadhaarDB[aadhaar];
    if (!citizenData) {
      return res.status(404).json({ success: false, message: 'Aadhaar not found in database' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(aadhaar, { otp, expiry, attempts: 0 });

    console.log(`[KYC OTP] Aadhaar: ${aadhaar}, OTP: ${otp}`); // For demo purposes

    res.json({
      success: true,
      message: 'OTP sent to registered mobile number (simulated)',
      otp: otp, // Returning OTP for demo - in production, send via SMS
      maskedMobile: '******7890'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/kyc/verify-otp
router.post('/verify-otp', protect, async (req, res) => {
  try {
    const { aadhaar, otp } = req.body;

    const stored = otpStore.get(aadhaar);
    if (!stored) {
      return res.status(400).json({ success: false, message: 'OTP not generated or expired. Please request again.' });
    }

    if (stored.attempts >= 3) {
      otpStore.delete(aadhaar);
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request new OTP.' });
    }

    if (Date.now() > stored.expiry) {
      otpStore.delete(aadhaar);
      return res.status(400).json({ success: false, message: 'OTP expired. Please request again.' });
    }

    if (stored.otp !== otp) {
      stored.attempts++;
      return res.status(400).json({ success: false, message: `Invalid OTP. ${3 - stored.attempts} attempts remaining.` });
    }

    otpStore.delete(aadhaar);

    // Return citizen data
    const citizenData = mockAadhaarDB[aadhaar];
    res.json({
      success: true,
      message: 'OTP verified successfully',
      citizenData: {
        ...citizenData,
        aadhaar: aadhaar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/kyc
router.post('/', protect, async (req, res) => {
  try {
    const kyc = await KYC.create({
      ...req.body,
      submittedBy: req.user._id
    });

    // Create notification for pending KYC
    if (kyc.status === 'pending') {
      await Notification.create({
        title: 'New KYC Submission',
        message: `New ${kyc.mode} KYC submitted for ${kyc.name}`,
        type: 'info',
        targetRole: 'BDO',
        relatedModule: 'kyc',
        relatedId: kyc._id
      });
    }

    res.status(201).json({ success: true, data: kyc, message: 'KYC submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/kyc/:id/approve
router.put('/:id/approve', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const kyc = await KYC.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      remarks: req.body.remarks || ''
    }, { new: true });

    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found' });
    res.json({ success: true, data: kyc, message: 'KYC approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/kyc/:id/reject
router.put('/:id/reject', protect, authorize('BDO', 'DeptHead'), async (req, res) => {
  try {
    const kyc = await KYC.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      remarks: req.body.remarks || ''
    }, { new: true });

    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found' });
    res.json({ success: true, data: kyc, message: 'KYC rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
