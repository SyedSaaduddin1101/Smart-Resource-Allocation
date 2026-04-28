# 🌉 BridgeMapper – Smart Resource Allocation for Social Impact

BridgeMapper is a powerful web application that helps NGOs and local social groups **collect scattered community data** (paper surveys, voice notes, text reports, CSV files) and **visualise urgent local needs** on a live heatmap. Volunteers can **match their skills** to tasks and accept missions in real time, creating an efficient, data‑driven volunteer coordination system.

> 🏆 Built for the **Google Solutions Challenge 2026** – Problem Statement #5: Smart Resource Allocation.

---

## ✨ Key Features

### 📥 Multi‑Format Data Ingestion
- **Paper surveys** – take a photo, Tesseract.js OCR extracts text.
- **Voice reports** – speak directly into the browser (Web Speech API).
- **Text reports** – manual field notes.
- **CSV upload** – bulk import of records.
- **Documents** – PDF, DOCX, TXT support.

### 🗺️ Live Urgency Map
- **Coloured circles** – red (high urgency), orange (medium), green (low).
- Real‑time updates – new tasks appear instantly.
- **Skill‑based filtering** – volunteers only see tasks that match their expertise.

### 📊 Priority Queue
- Ranked list of open tasks based on urgency.
- One‑click acceptance.

### 🎮 Gamification
- **Points & badges** – volunteers earn points for completing tasks.
- Badges: *Community Helper*, *Super Volunteer*, *Dedicated Hero*.

### 👑 Admin Control Panel
- **Task management** – change status (open/assigned/completed), delete tasks.
- **Volunteer management** – update skills, view points.
- **Create admin accounts** – no need to share personal emails.
- **Impact dashboard** – live charts showing task completion and urgency distribution.

### 💬 Real‑time Chat
- Task‑specific chat between NGOs and volunteers (inside map popups).

### 📱 Progressive Web App (PWA)
- Installable on mobile/desktop, works offline, caches map tiles.

### 🔐 Authentication
- Google Sign‑In & Email/Password with email verification.
- First‑user becomes admin automatically (or via “Make me Admin” button).

---

## 🛠️ Technology Stack

| Area | Technologies |
|------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Leaflet (map) |
| **Backend & DB** | Firebase (Authentication, Firestore, Hosting, Cloud Functions) |
| **AI & Matching** | Vertex AI Gemini (optional), keyword‑based urgency detection |
| **OCR** | Tesseract.js (client‑side, free) |
| **Voice** | Web Speech API |
| **Charts** | Chart.js |
| **Icons** | Heroicons |
| **Deployment** | GitHub Pages / Firebase Hosting |

---

## 🚀 Live Demo

🔗 [https://bridgemapper-d0630.web.app](https://bridgemapper-d0630.web.app)  
*(Firebase Hosting – replace with your actual URL)*

🔗 [GitHub Repository](https://github.com/SyedSaaduddin1101/Smart-Resource-Allocation)

---

---

## 🧑‍💻 Installation & Setup (Local Development)

```bash
# Clone the repository
git clone https://github.com/SyedSaaduddin1101/Smart-Resource-Allocation.git
cd Smart-Resource-Allocation

# Install dependencies
npm install

# Create a .env file with your Firebase config (see .env.example)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Start development server
npm run dev
