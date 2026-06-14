# 📊 Biz Smart Tracker

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A comprehensive business management platform designed for small-to-medium enterprises. Biz Smart Tracker provides real-time sales tracking, inventory management, employee attendance, expense monitoring, and intelligent reporting — all in a single, unified dashboard.

---

## ✨ Features

- **📈 Sales & Revenue Tracking** — Record, categorize, and visualize daily sales with interactive Chart.js dashboards.
- **📦 Inventory Management** — Track stock levels, custom inventory fields, and product catalogs with automated alerts.
- **👥 Employee Attendance** — Monitor employee check-ins, absences, and work hours.
- **💰 Expense Management** — Log and categorize business expenses for financial clarity.
- **🔔 Real-Time Notifications** — Socket.IO-powered live notifications for critical business events.
- **📊 Intelligent Reports** — Generate financial summaries, sales reports, and export data.
- **🔐 Authentication & Security** — JWT-based auth, Google & Facebook OAuth, OTP verification, CSRF protection, rate limiting, and Helmet security headers.
- **👤 Multi-Role Access** — Role-based access control with company-level data isolation.
- **🏢 Multi-Company Support** — Manage multiple business entities under a single account.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, React Router v7, Chart.js, Axios |
| **Backend** | Node.js, Express 5, Mongoose, Socket.IO |
| **Database** | MongoDB |
| **Auth** | JWT, Passport.js (Google OAuth, Facebook OAuth), OTP |
| **Security** | Helmet, CORS, CSRF, Rate Limiting, Joi Validation |
| **Email** | Nodemailer, Resend |
| **Deployment** | Vercel (Frontend) |

---

## 📦 Getting Started

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account or local MongoDB instance
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/saif55045/Biz-Smart-Tracker-System.git
   cd Biz-Smart-Tracker-System
   ```

2. **Set up the Backend:**
   ```bash
   cd Backend
   npm install
   cp env.example .env
   # Edit .env with your MongoDB URI, JWT secret, and OAuth credentials
   npm start
   ```

3. **Set up the Frontend:**
   ```bash
   cd Client
   npm install
   npm run dev
   ```

4. **Environment Variables (Backend `.env`):**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

---

## 📐 Project Structure

```
Biz-Smart-Tracker-System/
├── Backend/
│   ├── config/               # Database & Passport configuration
│   ├── controller/           # Route handlers (auth, sales, inventory, etc.)
│   ├── middleware/            # Auth, CSRF, and validation middleware
│   ├── models/               # Mongoose schemas (Company, Attendance, etc.)
│   ├── server.js             # Express server entry point
│   └── package.json
├── Client/
│   ├── components/           # Reusable UI components (Button, Toast, etc.)
│   ├── pages/                # Page views (Auth, Dashboard, Reports)
│   ├── context/              # React Context providers
│   ├── index.html            # App entry
│   └── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
