# 🥗 NutriMan — Smart Calorie Tracker & Food Ordering

**An AI-powered nutrition and food ordering platform designed for Indian users.**
Track calories, get personalised meal plans, and order food based on your diet and fitness goals — all in one place.

</div>

---

## 📋 Table of Contents

* About the Project
* Features
* Tech Stack
* Getting Started
* Project Structure
* Environment Variables
* Deployment
* Roadmap
* Contributing
* License

---

## 🌟 About the Project

**NutriMan** is a full-stack nutrition tracking and food ordering application built specifically for Indian users.

It combines:

* Smart calorie tracking
* AI-based meal suggestions
* Diet-aware food ordering
* Personalised health insights

Unlike generic apps, NutriMan adjusts recommendations based on:

* Fitness goal (Fat Loss / Maintenance / Muscle Gain)
* Experience level (Beginner / Intermediate / Advanced)
* Dietary preference (Veg / Vegan / High Protein / etc.)

---

## ✨ Features

### 🎯 Smart Nutrition Tracking

* Experience-based protein calculation
* Daily calorie targets
* Real-time macro tracking (Protein / Carbs / Fats)
* Meal-wise tracking (Breakfast / Lunch / Snack / Dinner)
* Weekly calorie overview

---

### 🤖 AI Health Assistant

* Personalised nutrition advice
* Indian recipe suggestions
* Goal-based meal planning
* Context-aware responses (based on user profile)

---

### 🛵 Food Ordering (Diet-Based)

* Browse food options based on your selected diet
* Personalised recommendations (veg, vegan, high-protein, etc.)
* Add items to cart with quantity control
* Order flow with status simulation
* Automatically logs ordered food into calorie tracker

---

### 📊 Analytics & Insights

* Daily calorie breakdown
* Macro distribution
* Weekly progress tracking
* BMI calculation (South Asian standards)

---

### 👤 User Management

* Firebase Authentication (Email + Google)
* Complete onboarding flow
* Profile editing with live updates
* Cloud data sync

---

### 🌱 Personalisation

* Goal-based recommendations
* Experience-level adjustments
* Activity-level calibration
* Diet-specific filtering

---

## 🛠 Tech Stack

| Layer    | Technology              |
| -------- | ----------------------- |
| Frontend | React 18, Vite          |
| Backend  | Node.js, Express        |
| Database | Firebase Firestore      |
| Auth     | Firebase Authentication |
| AI       | Google Gemini API       |
| State    | React Context API       |

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* Firebase project
* Gemini API key

---

### Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/nutriman.git
cd nutriman
```

```bash
cd frontend
npm install
npm run build
```

```bash
cd ../backend
npm install
node src/server.js
```

Open:

```
http://localhost:4000
```

---

## 📁 Project Structure

```
nutriman/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── config/
│   │   └── utils/
│
└── backend/
    └── src/
```

---

## 🔑 Environment Variables

Create `.env` in frontend:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project
```

Create `.env` in backend:

```env
GEMINI_API_KEY=your_key
```

---

## 🌐 Deployment

You can deploy using:

* Render (backend)
* Firebase Hosting (frontend)

---

## 🗺 Roadmap (Future Enhancements)

* 📅 Meal planning calendar
* 🛰 Real-time order tracking (live delivery tracking with maps)
* 🍽 Restaurant integrations (real food delivery system)
* 📸 Food image recognition (AI-based calorie detection)
* 🔔 Smart reminders
* 📱 Mobile app (React Native)
* 📈 Body measurements tracker
* 🛒 Grocery list generator

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push and create a PR

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Built for learning, real-world application, and portfolio demonstration.

If you find this project useful, consider giving it a ⭐ on GitHub.

---
