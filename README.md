# CXR-RRG (Chest X-Ray Radiology Report Generation)

CXR-RRG is a full-stack application for managing chest X-ray analysis workflows.

It provides:
- User authentication (register/login)
- X-ray upload and AI report generation flow
- Report history management (view, edit, delete, clear)
- PDF report export
- MongoDB persistence for users and reports

## Table of Contents

- [1. Architecture](#1-architecture)
- [2. Tech Stack](#2-tech-stack)
- [3. Project Structure](#3-project-structure)
- [4. Prerequisites](#4-prerequisites)
- [5. Environment Setup](#5-environment-setup)
- [6. Installation](#6-installation)
- [7. How to Run (Detailed)](#7-how-to-run-detailed)
- [8. API Reference](#8-api-reference)
- [9. Data Models](#9-data-models)
- [10. Validation and Smoke Tests](#10-validation-and-smoke-tests)
- [11. Common Issues and Fixes](#11-common-issues-and-fixes)
- [12. Security and Git Safety Checklist](#12-security-and-git-safety-checklist)
- [13. Scripts](#13-scripts)
- [14. Known Limitations](#14-known-limitations)
- [15. License](#15-license)

## 1. Architecture

The app currently depends on two API services:

1. Local Node.js backend (Express + MongoDB)
- Default URL: `http://127.0.0.1:5000`
- Handles auth, report save, history CRUD, static uploads

2. External AI inference endpoint
- Configured directly in frontend code (`UserDashboard.js`)
- Expected endpoint: `POST /predict`
- Expected response shape:

```json
{
  "report": "Long radiology report text..."
}
```

Runtime flow:

1. User logs in from frontend.
2. User uploads X-ray in dashboard.
3. Frontend calls external AI endpoint to generate report text.
4. User clicks Save to History.
5. Frontend sends image + report text to local backend.
6. Backend stores data in MongoDB and serves it via history APIs.

## 2. Tech Stack

Frontend:
- React 19
- react-router-dom
- framer-motion
- axios
- jsPDF + jspdf-autotable

Backend:
- Node.js + Express
- Mongoose
- Multer
- bcryptjs
- dotenv

Database:
- MongoDB Atlas or local MongoDB

## 3. Project Structure

```text
cxr-rrg/
  backend/
    models/
      Report.js
      User.js
    uploads/
    .env.example
    package.json
    server.js
  frontend/
    public/
    src/
      components/
      context/
      pages/
      App.js
    package.json
  README.md
```

## 4. Prerequisites

Install these first:
- Node.js 18 or newer
- npm 9 or newer
- MongoDB connection string
- Optional: ngrok (or any public tunnel) if AI inference runs outside local machine

Check versions:

```bash
node -v
npm -v
```

## 5. Environment Setup

### Backend `.env`

Use `backend/.env.example` as reference and create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<dbName>
DOCTOR_EMAIL=doctor@example.com
DOCTOR_PASSWORD=change-me
JWT_SECRET=replace-with-strong-random-secret
```

Notes:
- `JWT_SECRET` exists in template but is not used in current backend logic.
- `DOCTOR_EMAIL` and `DOCTOR_PASSWORD` are for static doctor login.

### Frontend API Configuration

Current code uses hardcoded URLs:
- `frontend/src/pages/Login.js` -> local backend URL
- `frontend/src/pages/Register.js` -> local backend URL
- `frontend/src/pages/History.js` -> local backend URL
- `frontend/src/pages/UserDashboard.js` -> external AI inference URL and local backend URL

Before running, confirm these URLs match your environment.

## 6. Installation

From repository root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 7. How to Run (Detailed)

### Option A: Local Full Run (Most Common)

Open 2 terminals.

Terminal 1 (Backend):

```bash
cd backend
npm run dev
```

Expected log:
- `Server running on port 5000`
- `MongoDB connected` (if `MONGO_URI` is valid)

Terminal 2 (Frontend):

```bash
cd frontend
npm start
```

Expected behavior:
- Browser opens at `http://localhost:3000`
- Landing page loads

### Option B: If AI Inference Is Hosted Remotely (Colab/ngrok)

1. Start your inference service.
2. Get public URL (example: `https://xxxx.ngrok-free.app`).
3. Update `API_URL` in `frontend/src/pages/UserDashboard.js`.
4. Ensure endpoint is reachable at `POST /predict`.
5. Restart frontend (`npm start`) after changes.

### Option C: Run Backend Without MongoDB (Debug only)

Backend can start without `MONGO_URI`, but DB routes will fail.
Use this only for non-persistence UI debugging.

## 8. API Reference

Base backend URL: `http://127.0.0.1:5000`

### Auth

`POST /api/auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response (success):

```json
{
  "message": "User registered",
  "user": {
    "email": "user@example.com",
    "role": "user"
  }
}
```

`POST /api/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

### Reports

`POST /api/upload`
- Multipart form fields:
- `image` (required)
- `email` (optional)
- `patientName` (optional)
- `notes` (optional)

`POST /api/save-report`
- Multipart form fields:
- `image` (required)
- `email` (optional)
- `patientName` (optional)
- `notes` (optional)
- `reportText` (optional)

`GET /api/reports`
- Returns all reports (latest first)

`GET /api/history?email=<user-email>`
- Returns reports for a specific user

`PUT /api/history/:id`

Request:

```json
{
  "patientName": "Jane Doe",
  "notes": "Updated note",
  "finding": "Updated finding text"
}
```

`DELETE /api/history/:id`
- Deletes one report

`DELETE /api/history/clear/all?email=<user-email>`
- Deletes all reports for one user

### Static Uploads

`GET /uploads/<file-name>` serves files from `backend/uploads`.

## 9. Data Models

### User

```js
{
  email: String,      // required, unique
  password: String,   // required, hashed
  role: String        // "user" or "doctor"
}
```

### Report

```js
{
  userEmail: String,    // required
  patientName: String,  // required
  notes: String,
  imagePath: String,    // required
  aiReport: Object,     // required
  createdAt: Date,
  updatedAt: Date
}
```

## 10. Validation and Smoke Tests

After app is running, test this sequence:

1. Register new user from UI.
2. Login with same account.
3. Open Dashboard.
4. Upload an image and run analysis.
5. Save report to history.
6. Open History and verify report appears.
7. Open report modal and edit fields.
8. Download PDF.
9. Delete one report.
10. Clear all history.

Quick backend checks with curl (PowerShell/cmd with curl):

```bash
curl http://127.0.0.1:5000/api/reports
```

```bash
curl "http://127.0.0.1:5000/api/history?email=user@example.com"
```

## 11. Common Issues and Fixes

MongoDB connection failure:
- Verify `MONGO_URI` in `backend/.env`
- Check Atlas network access and credentials

Frontend cannot call backend:
- Confirm backend is running on port `5000`
- Confirm `API_URL` values in frontend pages

AI report generation fails:
- Confirm external inference URL is active
- Confirm `POST /predict` exists
- Check ngrok/host tunnel status

Uploaded image not rendering:
- Confirm backend static route `/uploads` is reachable
- Confirm file exists inside `backend/uploads`

History is empty after save:
- Confirm same email is used in login and report save payload

## 12. Security and Git Safety Checklist

Before pushing to Git:

1. Never commit real `.env` files.
2. Keep only `.env.example` templates in repository.
3. Rotate secrets immediately if leaked.
4. Use different credentials for dev/staging/prod.
5. Remove hardcoded external URLs from code before sharing publicly.

Recommended cleanup:
- Move all frontend API URLs to environment variables.
- Add backend auth tokens/JWT for route protection.

## 13. Scripts

Backend (`backend/package.json`):
- `npm run dev` -> start with nodemon
- `npm start` -> start with node

Frontend (`frontend/package.json`):
- `npm start` -> development server
- `npm run build` -> production build
- `npm test` -> tests
- `npm run eject` -> eject CRA config

## 14. Known Limitations

- Frontend currently stores only email in localStorage (no token auth flow).
- Frontend currently uses hardcoded API URLs in page files.
- `JWT_SECRET` is not actively used in backend routes yet.
- No centralized role-based route guards on backend APIs.

## 15. License

See `LICENSE` file in repository root.
