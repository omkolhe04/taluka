const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config();

const app = express();

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/departments',   require('./routes/departments'));
app.use('/api/villages',      require('./routes/villages'));
app.use('/api/revenue',       require('./routes/revenue'));
app.use('/api/kyc',           require('./routes/kyc'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/verification',  require('./routes/verification'));
app.use('/api/bills',         require('./routes/bills'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/employees',     require('./routes/employees'));
app.use('/api/excel',         require('./routes/excel'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/students', require('./routes/students'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
