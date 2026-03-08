# Sahaayak AI

A full-stack web application that helps users find eligible government schemes. Built with React (frontend), Node.js + Express (backend), and local JSON files for data storage.

## Features

- **User Login**: Mobile number + OTP (mock OTP: `123456` for demo)
- **Family Profiles**: One user can create and manage multiple profiles (self + family members)
- **Multilingual**: English, Hindi (हिंदी), Tamil (தமிழ்) with language selector
- **Voice Support**: 
  - Speaker button: reads page content using browser speech synthesis
  - Mic button: voice input converted to text (shown in banner)
- **User Profile Form**: Name, Age, Gender, State, Occupation, Annual income, Category (General/OBC/SC/ST), Farmer (Y/N), Disability (Y/N)
- **Scheme Recommendations**: Backend checks eligibility and returns matching schemes from `schemes.json`
- **Document Upload**: Upload Aadhaar, PAN, or other files (stored in `backend/uploads`)
- **UI**: Clean, mobile-responsive, large buttons for rural users

## Tech Stack

- **Frontend**: React 18, React Router, Vite
- **Backend**: Node.js, Express
- **Data**: Local JSON files (`backend/data/users.json`, `backend/data/schemes.json`)

## Project Structure

```
sahaayak-ai/
├── backend/
│   ├── data/
│   │   ├── schemes.json   # Government schemes + eligibility rules
│   │   └── users.json    # Users and profiles (created at runtime)
│   ├── uploads/          # Uploaded documents (local)
│   ├── routes/
│   │   ├── auth.js       # Login, OTP
│   │   ├── profiles.js   # CRUD profiles
│   │   ├── schemes.js    # List schemes, eligible schemes
│   │   └── uploads.js    # File upload
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, VoiceBar
│   │   ├── context/      # Auth, Language
│   │   ├── i18n/        # Translations (en, hi, ta)
│   │   ├── pages/       # Login, Home, Profiles, Schemes, Documents
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## How to Run Locally

### Prerequisites

- Node.js 18+ and npm (or yarn)

### 1. Backend (port 5000)

```bash
cd sahaayak-ai/backend
npm install
npm start
```

Backend runs at **http://localhost:5000**

### 2. Frontend (port 3004)

Open a **new terminal**:

```bash
cd sahaayak-ai/frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3004**

### 3. Use the app

1. Open **http://localhost:3004** in your browser.
2. **Login**: Enter any 10-digit mobile number → click "Send OTP" → enter OTP **123456** → Verify.
3. Add a **profile** (My Profiles → Add Profile) with your details.
4. On **Home**, select the profile to see **eligible schemes**.
5. Go to **Schemes** to see all schemes or filter by profile.
6. Use **Documents** to upload Aadhaar/PAN/other files (stored in `backend/uploads`).
7. Use the **language** dropdown (English / हिंदी / தமிழ்) to switch language.
8. Use **speaker** (🔊) to hear the page; use **mic** (🎤) to speak and see text.

### Demo OTP

- For any mobile number, use **123456** as the OTP to login (mock only).

## API (Backend)

- `POST /api/auth/send-otp` — body: `{ "mobile": "9876543210" }`
- `POST /api/auth/verify-otp` — body: `{ "mobile": "9876543210", "otp": "123456" }` → returns token + user
- `GET /api/profiles` — headers: `Authorization: Bearer <token>`
- `POST /api/profiles` — body: profile fields
- `PUT /api/profiles/:id` — update profile
- `DELETE /api/profiles/:id` — delete profile
- `GET /api/schemes` — list all schemes
- `POST /api/schemes/eligible` — body: profile object → returns eligible schemes
- `POST /api/uploads` — multipart file upload

## Changes not showing on localhost? (e.g. Chrome shows old version)

If Cursor’s browser shows the new version but **Chrome** (or another browser) still shows the old one, Chrome is using a cached copy. Do this **in Chrome**:

### Option A – Hard refresh (try first)
1. Open **http://localhost:3004** in Chrome.
2. Press **`Ctrl + Shift + R`** (Windows/Linux) or **`Cmd + Shift + R`** (Mac).  
   Or **`Ctrl + F5`** (Windows).

### Option B – Empty cache and hard reload
1. Open **http://localhost:3004** in Chrome.
2. Press **F12** to open DevTools.
3. **Right‑click** the refresh button (next to the address bar).
4. Click **“Empty Cache and Hard Reload”**.

### Option C – Clear site data for localhost
1. In Chrome, go to **http://localhost:3004**.
2. Press **F12** → open the **Application** tab (or **Storage** in some versions).
3. Under **Storage** in the left sidebar, click **“Clear site data”**.
4. Close the tab, open a **new** tab, and go to **http://localhost:3004** again.

### Option D – Disable cache while DevTools is open
1. Open **F12** (DevTools).
2. Go to the **Network** tab.
3. Check **“Disable cache”**.
4. Keep DevTools open and refresh the page.

After this, **restart the frontend** so the new no-cache headers apply:
```bash
cd sahaayak-ai/frontend
# Press Ctrl+C if dev server is already running, then:
npm run dev
```
Then open **http://localhost:3004** in Chrome again (new tab or after clearing cache).

## Notes

- No database or AWS; everything runs locally.
- Users and profiles are stored in `backend/data/users.json`.
- Uploaded files are stored in `backend/uploads/`.
- Voice input (mic) works best in Chrome/Edge (browser support for Speech Recognition).
