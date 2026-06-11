const express     = require('express');
const router      = express.Router();
const mongoose    = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const upload      = require('../middleware/upload');
const XLSX        = require('xlsx');
const Revenue     = require('../models/Revenue');
const ExcelUpload = require('../models/ExcelUpload');
const Village     = require('../models/Village');

// ── helpers ───────────────────────────────────────────────────────────────────

function batchId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function normaliseRow(raw) {
  const out = {};
  for (const k of Object.keys(raw)) {
    // Strip whitespace, newlines, ₹ symbol, parentheses, hyphens and lowercase
    const clean = k
      .replace(/[\r\n]+/g, ' ')   // newlines → space
      .trim()
      .toLowerCase()
      .replace(/[₹()\-]/g, '')    // strip ₹ () -
      .replace(/\s+/g, '');       // collapse all whitespace
    out[clean] = typeof raw[k] === 'string' ? raw[k].trim() : raw[k];
  }
  return out;
}

function pick(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  return '';
}

/**
 * parseRows — robustly handles multi-row merged headers.
 *
 * Strategy:
 *   1. Convert the sheet to an array-of-arrays (no header inference).
 *   2. Scan the first 10 rows to find the "real" header row — the one
 *      that contains a cell matching /village/i.
 *   3. Use that row index as the header in sheet_to_json so XLSX
 *      correctly maps every column.
 *   4. Normalise all keys via normaliseRow().
 *
 * This handles the common village-revenue template that has 2 merged
 * group-header rows ("Basic Info", "Demand", "Recovery", "Meta") above
 * the real column headers.
 */
function parseRows(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet     = workbook.Sheets[sheetName];

  // Step 1 — raw array-of-arrays to locate the true header row
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let headerRowIndex = 0; // fallback: first row
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const rowStr = aoa[i].map(c => String(c)).join('|').toLowerCase();
    if (rowStr.includes('village')) {
      headerRowIndex = i;
      break;
    }
  }

  // Step 2 — re-parse using the discovered header row
  const raw = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    range: headerRowIndex,   // treat this row as column headers
  });

  return raw.map(normaliseRow);
}

/**
 * resolveAmount — tries every plausible amount column name.
 *
 * The village-revenue template's "Total Recovery (₹)" normalises to
 * "totalrecovery" after our normaliseRow strips ₹ and parens.
 * We prefer Total Recovery over Current Recovery or Arrears Recovery.
 */
function resolveAmount(row) {
  return parseFloat(
    pick(
      row,
      // Standard / generic names
      'amount', 'amt', 'totalamount', 'total',
      // Village-revenue template — "Total Recovery (₹)" → "totalrecovery"
      'totalrecovery',
      // Fallbacks
      'currentrecovery', 'arrearsrecovery',
      'recovery', 'netamount', 'paidamount',
    ) || 0
  );
}

/**
 * resolveVillageName — tries every plausible village column name.
 * "Village Name" normalises to "villagename" after stripping spaces.
 */
function resolveVillageName(row) {
  return (
    pick(row, 'villagename', 'village_name', 'village', 'gram', 'grampanchayat') || ''
  )
    .toString()
    .trim()
    .toLowerCase();
}

/**
 * resolveType — tries every plausible revenue-type column name.
 * "Revenue Type" normalises to "revenuetype".
 */
function resolveType(row) {
  return (
    pick(row, 'revenuetype', 'type', 'taxtype', 'tax_type', 'revenue_type') || ''
  )
    .toString()
    .trim();
}

function buildPreview(rows) {
  return rows.slice(0, 10).map(row => ({
    type:        resolveType(row),
    villageName: resolveVillageName(row),
    amount:      resolveAmount(row),
    year:        parseInt(pick(row, 'year', 'yr') || new Date().getFullYear()),
    month:       parseInt(pick(row, 'month', 'mon', 'mm') || (new Date().getMonth() + 1)),
  }));
}

// ── Village validation helper ─────────────────────────────────────────────────

async function validateVillages(allFiles) {
  const excelVillages = new Set();
  for (const fileData of allFiles) {
    for (const raw of (fileData.allRows || [])) {
      const row  = (typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
      const name = resolveVillageName(row);
      if (name) excelVillages.add(name);
    }
  }

  if (!excelVillages.size) return { valid: true, excelVillages: [] };

  const dbVillages = await Village.find({
    nameLower: { $in: [...excelVillages] },
    isActive: true
  }).lean();

  const dbVillageNames  = new Set(dbVillages.map(v => v.nameLower));
  const invalidVillages = [...excelVillages].filter(v => !dbVillageNames.has(v));

  if (invalidVillages.length > 0) {
    return { valid: false, invalidVillages };
  }
  return { valid: true, excelVillages: [...excelVillages] };
}

// ── GET /api/excel/history ────────────────────────────────────────────────────

router.get('/history', protect, authorize('DataEntry', 'BDO', 'DeptHead'), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'DataEntry') {
      filter.userId = req.user._id;
    } else if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    const history = await ExcelUpload.find(filter)
      .populate('userId', 'name email')
      .sort({ uploadedAt: -1 });
    res.json({ success: true, data: history, count: history.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/excel/history/:id ─────────────────────────────────────────────

router.delete('/history/:id', protect, authorize('DataEntry', 'BDO'), async (req, res) => {
  try {
    const record = await ExcelUpload.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Upload record not found' });
    if (req.user.role === 'DataEntry' && record.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await ExcelUpload.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Upload record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/excel/preview ───────────────────────────────────────────────────

router.post(
  '/preview',
  protect,
  authorize('BDO', 'DataEntry'),
  (req, res, next) => { req.uploadSubDir = 'excel'; next(); },
  upload.array('files', 20),
  async (req, res) => {
    try {
      if (!req.files || !req.files.length) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const previews = req.files.map(file => {
        try {
          const workbook = XLSX.readFile(file.path);
          const rows     = parseRows(workbook);
          return {
            originalName: file.originalname,
            savedPath:    file.path,
            totalRows:    rows.length,
            columns:      rows.length ? Object.keys(rows[0]) : [],
            preview:      rows.slice(0, 10),
            allRows:      rows,
          };
        } catch (e) {
          return {
            originalName: file.originalname,
            savedPath:    file.path,
            error:        'Failed to parse: ' + e.message,
            totalRows:    0, columns: [], preview: [], allRows: [],
          };
        }
      });

      const validFiles = previews.filter(p => !p.error);
      const validation = await validateVillages(validFiles);

      const previewsWithFlags = previews.map(p => {
        if (p.error || !validation.invalidVillages?.length) return p;
        const flagged = p.preview.map(row => {
          const vName = resolveVillageName(row);
          return { ...row, _invalidVillage: validation.invalidVillages.includes(vName) };
        });
        return { ...p, preview: flagged };
      });

      res.json({
        success:           true,
        message:           `Parsed ${req.files.length} file(s)`,
        fileCount:         req.files.length,
        previews:          previewsWithFlags,
        villageValidation: {
          valid:           validation.valid,
          invalidVillages: validation.invalidVillages || [],
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/excel/import-revenue ────────────────────────────────────────────

router.post('/import-revenue', protect, authorize('BDO', 'DataEntry'), async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files) || !files.length) {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }

    // ── STEP 1: Village validation ────────────────────────────────────────────
    const validation = await validateVillages(files);

    if (!validation.valid) {
      const names = validation.invalidVillages.map(v => `"${v}"`).join(', ');
      const msg   = validation.invalidVillages.length === 1
        ? `Village ${names} is not created by BDO. Please ask BDO to add it first.`
        : `These villages are not created by BDO: ${names}. Please ask BDO to add them first.`;

      return res.status(400).json({
        success:         false,
        message:         msg,
        invalidVillages: validation.invalidVillages,
        code:            'VILLAGE_NOT_FOUND',
      });
    }

    // ── STEP 2: Parse rows and insert ─────────────────────────────────────────
    const batch          = batchId();
    const now            = new Date();
    const inserted       = [];
    const errors         = [];
    const historyRecords = [];

    for (const fileData of files) {
      const { originalName, allRows, savedPath } = fileData;
      if (!allRows || !allRows.length) continue;

      const fileInserted = [];
      const fileErrors   = [];

      for (const raw of allRows) {
        const row = (typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};

        const villageName = resolveVillageName(row);
        const type        = resolveType(row);
        const amount      = resolveAmount(row);
        const year        = parseInt(pick(row, 'year', 'yr')         || now.getFullYear());
        const month       = parseInt(pick(row, 'month', 'mon', 'mm') || (now.getMonth() + 1));
        const date        = (pick(row, 'date', 'dt', 'day') || '').toString().trim();

        if (!villageName || !type || amount <= 0) {
          const reason = !villageName
            ? 'Missing village name'
            : !type
            ? 'Missing revenue type'
            : 'Amount is 0 or missing';
          fileErrors.push({ row, reason });
          errors.push({ file: originalName, row, reason });
          continue;
        }

        const entry = {
          villageName,
          type,
          amount,
          dueAmount:     0,
          year,
          month,
          date,
          uploadedBy:    req.user._id,
          uploadBatchId: batch,
        };
        fileInserted.push(entry);
        inserted.push(entry);
      }

      historyRecords.push({
        userId:       req.user._id,
        fileName:     originalName,
        filePath:     savedPath || '',
        totalRows:    allRows.length,
        importedRows: fileInserted.length,
        skippedRows:  fileErrors.length,
        batchId:      batch,
        previewData:  buildPreview(allRows),
        uploadedAt:   now,
      });
    }

    if (!inserted.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid rows found. Required columns: Village Name, Revenue Type, Total Recovery (₹), Year, Month.',
        errors,
      });
    }

    const [revenueResult] = await Promise.all([
      Revenue.insertMany(inserted, { ordered: false }),
      ExcelUpload.insertMany(historyRecords, { ordered: false }),
    ]);

    res.json({
      success: true,
      message: `Imported ${revenueResult.length} revenue entries across ${files.length} file(s)`,
      count:   revenueResult.length,
      batchId: batch,
      skipped: errors.length,
      errors:  errors.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/excel/import-kyc ────────────────────────────────────────────────
const KYC = require('../models/KYC');

router.post('/import-kyc', protect, authorize('BDO', 'DataEntry'), async (req, res) => {
  try {
    const { data, villageId } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }
    const kycs = data.map(row => ({
      name:        row.name    || row.Name    || '',
      aadhaar:     String(row.aadhaar || '000000000000'),
      address:     row.address || '',
      mobile:      String(row.mobile  || ''),
      gender:      row.gender  || 'Male',
      mode:        'offline', status: 'pending',
      submittedBy: req.user._id,
      villageId:   villageId || null,
    })).filter(k => k.name);
    const result = await KYC.insertMany(kycs, { ordered: false });
    res.json({ success: true, message: `Imported ${result.length} KYC records`, count: result.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;