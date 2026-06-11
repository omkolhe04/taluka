# 🏛️ Smart Taluka Governance System

A complete web-based governance management system for Taluka-level government operations.

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Charts**: Chart.js
- **Auth**: JWT + bcryptjs

## 📁 Project Structure
```
taluka/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/       # Auth + upload middleware
│   ├── uploads/         # Uploaded files (auto-created)
│   ├── server.js        # Express server
│   └── seed.js          # Sample data seeder
└── frontend/
    ├── css/style.css    # Main stylesheet
    ├── js/
    │   ├── api.js       # API helper + offline support
    │   └── layout.js    # Sidebar/topbar renderer
    ├── pages/           # All HTML pages
    └── index.html       # Login page
```

## 🚀 Setup Instructions

### Step 1: Clone / Extract Project
```bash
cd taluka/backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and set your MongoDB URI:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taluka_governance
JWT_SECRET=your_super_secret_key_here
PORT=5000
```

> **For local MongoDB**: Use `mongodb://localhost:27017/taluka_governance`
> **For MongoDB Atlas**: Create free cluster at https://cloud.mongodb.com

### Step 4: Seed Sample Data
```bash
node seed.js
```

### Step 5: Start Server
```bash
npm start
# OR for development with auto-reload:
npm run dev
```

### Step 6: Open Browser
```
http://localhost:5000
```

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| BDO (Admin) | bdo@taluka.gov.in | admin123 |
| Department Head | depthead@taluka.gov.in | admin123 |
| Employee | employee@taluka.gov.in | admin123 |
| Data Entry | dataentry@taluka.gov.in | admin123 |

## 📡 API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register user
- `GET /api/auth/me` — Get current user

### Dashboard
- `GET /api/dashboard/stats` — All stats
- `GET /api/dashboard/recent-activity` — Recent KYC + Revenue

### KYC
- `GET /api/kyc` — List KYC records
- `POST /api/kyc/generate-otp` — Generate Aadhaar OTP
- `POST /api/kyc/verify-otp` — Verify OTP
- `POST /api/kyc` — Create KYC record
- `PUT /api/kyc/:id/approve` — Approve KYC
- `PUT /api/kyc/:id/reject` — Reject KYC

### Revenue
- `GET /api/revenue` — List revenue
- `POST /api/revenue` — Add revenue entry
- `PUT /api/revenue/:id` — Update revenue
- `GET /api/revenue/village-summary` — Village-wise summary

### Verification
- `GET /api/verification` — List verifications
- `POST /api/verification` — Submit (with image upload)
- `PUT /api/verification/:id/verify` — Approve
- `PUT /api/verification/:id/reject` — Reject

### Bills
- `GET /api/bills` — List bills
- `POST /api/bills` — Submit bill
- `PUT /api/bills/:id/approve` — Approve
- `PUT /api/bills/:id/reject` — Reject

### Analytics
- `GET /api/analytics/revenue-trends` — Monthly trends
- `GET /api/analytics/kyc-stats` — KYC statistics
- `GET /api/analytics/employee-productivity` — Employee data

## 👥 Role Permissions

| Feature | BDO | DeptHead | Employee | DataEntry |
|---------|-----|----------|----------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Revenue | ✅ | ✅ | ✅ (add) | ❌ |
| KYC | ✅ | ✅ | ✅ (add) | ❌ |
| Field Verification | ✅ | ✅ | ✅ (submit) | ❌ |
| Bill Verification | ✅ | ✅ | ❌ | ❌ |
| Departments | ✅ | ✅ (view) | ❌ | ❌ |
| Employees | ✅ | ✅ (view) | ❌ | ❌ |
| Analytics | ✅ | ✅ | ❌ | ❌ |
| Excel Upload | ✅ | ❌ | ❌ | ✅ |

## 🌐 Offline Support
- Form data automatically saved to localStorage when offline
- Auto-syncs when internet connection restores
- Visual indicator shows online/offline status

## 🔐 Security Features
- Aadhaar number masked (XXXX-XXXX-XXXX)
- Passwords hashed with bcrypt (12 salt rounds)
- JWT authentication with 7-day expiry
- OTP limited to 3 attempts, expires in 5 minutes
- Role-based API protection via middleware

## 📦 Dependencies
```json
{
  "express": "4.x",
  "mongoose": "7.x",
  "bcryptjs": "2.x",
  "jsonwebtoken": "9.x",
  "cors": "2.x",
  "dotenv": "16.x",
  "multer": "1.x",
  "xlsx": "0.18.x"
}
```
