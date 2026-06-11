const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Department = require('./models/Department');
const Village = require('./models/Village');
const Revenue = require('./models/Revenue');
const KYC = require('./models/KYC');
const { Notification, Bill } = require('./models/index');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taluka_governance';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Department.deleteMany(), Village.deleteMany(), Revenue.deleteMany(), KYC.deleteMany(), Notification.deleteMany(), Bill.deleteMany()]);
  console.log('Cleared existing data');

  // Create Departments
  const depts = await Department.insertMany([
    { name: 'Revenue Department', description: 'Handles all revenue collection' },
    { name: 'KYC Department', description: 'Citizen verification and KYC' },
    { name: 'Field Operations', description: 'On-ground field work and verification' },
    { name: 'Data Management', description: 'Data entry and management' }
  ]);
  console.log('Departments created');

  // Create Users
  const bdo = await User.create({ name: 'Rajesh Sharma (BDO)', email: 'bdo@taluka.gov.in', password: 'admin123', role: 'BDO' });
  const deptHead = await User.create({ name: 'Priya Patil', email: 'depthead@taluka.gov.in', password: 'admin123', role: 'DeptHead', departmentId: depts[0]._id });
  const emp1 = await User.create({ name: 'Suresh Kumar', email: 'employee@taluka.gov.in', password: 'admin123', role: 'Employee', departmentId: depts[0]._id });
  const emp2 = await User.create({ name: 'Anita Desai', email: 'employee2@taluka.gov.in', password: 'admin123', role: 'Employee', departmentId: depts[1]._id });
  const dataEntry = await User.create({ name: 'Mahesh Jadhav', email: 'dataentry@taluka.gov.in', password: 'admin123', role: 'DataEntry', departmentId: depts[3]._id });

  // Update dept head
  depts[0].headId = deptHead._id;
  await depts[0].save();
  console.log('Users created');

  // Create Villages
  const villages = await Village.insertMany([
    { name: 'Shivpur', taluka: 'Haveli', population: 3200, grampanchayat: 'Shivpur GP', pincode: '412213' },
    { name: 'Ramwadi', taluka: 'Haveli', population: 1800, grampanchayat: 'Ramwadi GP', pincode: '412214' },
    { name: 'Khadakwasla', taluka: 'Haveli', population: 4500, grampanchayat: 'Khadakwasla GP', pincode: '411024' },
    { name: 'Urse', taluka: 'Maval', population: 2100, grampanchayat: 'Urse GP', pincode: '410506' },
    { name: 'Talegaon', taluka: 'Maval', population: 5600, grampanchayat: 'Talegaon GP', pincode: '410507' },
    { name: 'Dehu', taluka: 'Haveli', population: 3800, grampanchayat: 'Dehu GP', pincode: '412101' }
  ]);
  console.log('Villages created');

  // Create Revenue
  const revenueData = [];
  const types = ['Pani Patti', 'Ghar Patti', 'Land Revenue'];
  const statuses = ['paid', 'paid', 'paid', 'pending', 'partial'];
  for (let m = 1; m <= 6; m++) {
    for (const v of villages) {
      for (const t of types) {
        revenueData.push({
          villageId: v._id, type: t,
          amount: Math.floor(Math.random() * 50000) + 5000,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          collectedBy: emp1._id,
          year: 2024, month: m,
          payerName: 'Various Citizens'
        });
      }
    }
  }
  await Revenue.insertMany(revenueData);
  console.log('Revenue records created');

  // Create KYC
  const kycNames = ['Ramesh Pawar', 'Sunita Kale', 'Prakash More', 'Lata Shinde', 'Vijay Naik', 'Kavita Gaikwad', 'Arun Bhosale', 'Meena Jagtap', 'Sunil Mane', 'Rekha Deshpande'];
  const kycData = kycNames.map((name, i) => ({
    name, aadhaar: `${100000000000 + i * 111111111}`.slice(0, 12),
    address: `Near Temple, ${villages[i % villages.length].name}`,
    mobile: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
    gender: i % 2 === 0 ? 'Male' : 'Female',
    villageId: villages[i % villages.length]._id,
    mode: i % 3 === 0 ? 'online' : 'offline',
    status: i < 6 ? 'approved' : 'pending',
    submittedBy: emp1._id,
    verifiedBy: i < 6 ? bdo._id : null,
    verifiedAt: i < 6 ? new Date() : null
  }));
  await KYC.insertMany(kycData);
  console.log('KYC records created');

  // Create Notifications
  await Notification.insertMany([
    { title: 'Welcome', message: 'Welcome to Smart Taluka Governance System', type: 'success', targetRole: 'all' },
    { title: 'Pending KYC Alert', message: '4 KYC records are pending verification', type: 'warning', targetRole: 'BDO', relatedModule: 'kyc' },
    { title: 'Revenue Target', message: 'Monthly revenue target achieved for Shivpur village', type: 'success', targetRole: 'BDO', relatedModule: 'revenue' },
    { title: 'Field Verification Pending', message: '2 field verifications awaiting approval', type: 'info', targetRole: 'DeptHead', relatedModule: 'verification' },
    { title: 'System Update', message: 'System maintenance scheduled for Sunday 2 AM', type: 'info', targetRole: 'all' }
  ]);

  // Create Sample Bills
  await Bill.insertMany([
    { title: 'Office Stationery', price: 450, marketPrice: 500, category: 'Stationery', vendor: 'Sharma Stationery', status: 'approved', submittedBy: emp1._id },
    { title: 'Vehicle Repair', price: 8500, marketPrice: 3000, category: 'Transport', vendor: 'Kumar Garage', isSuspicious: true, status: 'suspicious', suspiciousReason: 'Exceeds market price by 183%', submittedBy: emp2._id },
    { title: 'Computer Equipment', price: 12000, marketPrice: 15000, category: 'Equipment', vendor: 'Tech World', status: 'pending', submittedBy: dataEntry._id },
  ]);

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('BDO:       bdo@taluka.gov.in      / admin123');
  console.log('DeptHead:  depthead@taluka.gov.in / admin123');
  console.log('Employee:  employee@taluka.gov.in / admin123');
  console.log('DataEntry: dataentry@taluka.gov.in/ admin123');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
