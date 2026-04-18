# 🥗 NutriFlow

## HOW TO RUN (Read this first!)

### On Windows:
1. Double-click START.bat
2. Wait for it to finish
3. Open browser → http://localhost:4000

### On Mac / Linux:
1. Open Terminal in this folder
2. Run: bash START.sh
3. Open browser → http://localhost:4000

---

## Manual setup (if START scripts don't work)

Open terminal in the nutriflow/ folder and run:

  Step 1 — Build the frontend:
    cd frontend
    npm install
    npm run build
    cd ..

  Step 2 — Start the server:
    cd backend
    npm install
    node src/server.js

  Step 3 — Open: http://localhost:4000

---

## How it works

ONE server does everything:
- http://localhost:4000       → the React frontend (login, dashboard, etc.)
- http://localhost:4000/api   → the backend API (data, auth, orders)

You do NOT need to run two separate servers.
You do NOT need to configure anything.

---

## Files explained

  nutriflow/
  ├── START.bat          ← Double-click to start (Windows)
  ├── START.sh           ← Run to start (Mac/Linux)
  ├── frontend/
  │   ├── src/           ← React source code
  │   └── dist/          ← Built frontend (auto-generated)
  └── backend/
      └── src/server.js  ← Node.js server (serves frontend + API)

---

## Deployment (making it live online)

1. Push to GitHub:
   git init
   git add .
   git commit -m "NutriFlow"
   git remote add origin https://github.com/YOUR_USERNAME/nutriflow.git
   git push -u origin main

2. Deploy on Render.com (free):
   - New Web Service → connect GitHub repo
   - Root Directory: backend
   - Build Command: cd ../frontend && npm install && npm run build && cd ../backend && npm install
   - Start Command: node src/server.js
   - Done! Get a live URL.
