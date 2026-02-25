# Energy-Efficient Cloud Task Scheduler

An ML-powered dashboard for energy-efficient cloud task scheduling using Django + React.

---

## Requirements

| Tool | Version |
|------|---------|
| Python | **3.9 – 3.11** (⚠️ NOT 3.12+ — TensorFlow is incompatible) |
| Node.js | 18+ |
| npm | 9+ |

---

## Setup & Run

### 1. Clone the repository
```bash
git clone https://github.com/Naveen-086/Energy-efficient-cloud-task-scheduler.git
cd Energy-efficient-cloud-task-scheduler
```

---

### 2. Backend (Django)

```bash
cd backend/energy_scheduler
```

**Install Python dependencies:**
```bash
pip install -r ../requirements.txt
```

**Run database migrations:**
```bash
python manage.py migrate
```

**Start the Django server:**
```bash
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

> ⚠️ **First time only:** After the server starts, open the frontend and click **"Train Models"** on the Overview page. This trains and saves the ML models locally (takes 1–2 minutes).

---

### 3. Frontend (React + Vite)

Open a **new terminal** in the project root:

```bash
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Project Structure

```
project/
├── backend/
│   ├── requirements.txt          # Python dependencies
│   └── energy_scheduler/
│       ├── manage.py
│       ├── energy_scheduler/     # Django settings & URLs
│       └── ml_app/               # ML models, views, APIs
├── src/
│   └── components/               # React frontend components
├── package.json                  # Node.js dependencies
└── README.md
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `tensorflow` install fails | Make sure Python is **3.9–3.11**, not 3.12+ |
| `No Models Found` on dashboard | Click **"Train Models"** button on the Overview tab |
| CORS error in browser | Make sure Django backend is running on port 8000 |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` again |
| Frontend blank page | Run `npm install` then `npm run dev` |
