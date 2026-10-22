# 🥦 Pantry Pal

Pantry Pal is a full-stack web application designed for modern pantry inventory management. It allows users to track items using barcode scanning, monitor expiration dates, and organize their pantry by category and location.

**Live Demo:** https://pantry-pal-neon.vercel.app/

## Features

### Authentication
- Secure email & password registration (with auto-login) and login
- Password reset flow using **Brevo** for transactional emails
- **JWT**-based authentication securing API routes

### Pantry Management
- Full **CRUD** (Create, Read, Update, Delete) for pantry items  
- List sorted by **most recently added** first

### Item Entry
- **Camera barcode scanning** via `react-qr-barcode-scanner`  
- **Fetch Details** button: queries a custom backend endpoint that calls **Open Food Facts** to auto-fill:
  - Product Name  
  - Brand  
  - Quantity & Unit  
  - Product Image

### Organization & Tracking
- Assign custom **categories** (e.g., “Canned Goods”, “Spices”) and **locations** (e.g., “Fridge”, “Pantry Shelf”)  
- Filter the pantry view by **category**, **location**, or both

### Dashboard & Notifications
- **Pantry Overview**: stats panel showing *Total Items* and *Recently Added*  
- **Expiry Notifications**: panel highlighting items expiring within the next **7 days**

### AI Recipe Ideas
- **✨ Get a recipe** button generates a recipe from what's in your pantry using **Google Gemini**
- Two modes: **use expiring items first** (to cut food waste) or **balanced**
- Optional filters: meal type, dietary needs (vegetarian, vegan, gluten-free, kosher, halal, …), max cooking time, difficulty, and cuisine
- Each ingredient is marked as *from your pantry*, *basic staple* (salt, pepper, oil, water), or *missing*, with a short shopping list of anything you need to buy
- Rate limited to **10 recipes per user per hour**, plus a global daily cap to keep API costs in check

---

## Tech Stack

| Area      | Technology                                        |
|-----------|----------------------------------------------------|
| Frontend  | React, Vite, Tailwind CSS.                         |
| Backend   | Python 3, FastAPI, SQLAlchemy 2.0, Alembic         |
| Database  | PostgreSQL (hosted on Supabase)                    |
| Services  | Open Food Facts (barcode data), Brevo (email API), Google Gemini (AI recipes) |
| Deployment| Vercel (frontend), Render (backend)                |

---
## Project Structure

```text
pantry_pal/
├── backend/
│   ├── app.py             # FastAPI application
│   ├── alembic/           # Database migrations
│   ├── alembic.ini
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment variable template
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.local.example # Environment variable template
    ├── package.json
    ├── pnpm-lock.yaml
    └── vercel.json        # SPA rewrite rules for Vercel
```

## Run Local

### Prerequisites
- Python **3.10+**
- Node.js **18+** and **pnpm**
- A **PostgreSQL** database (e.g., free tier on Supabase)
- A **Brevo** (formerly Sendinblue) account for email sending
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey) (optional; only needed for AI recipes)

---

### 1) Backend Setup

```bash
# From repo root
cd backend

# Create & activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your env file
cp .env.example .env
# → Edit .env with your values (DB URL, JWT secret, Brevo API key, Gemini API key)

# Create the database tables
alembic upgrade head

# Run the server
uvicorn app:app --reload
# API at http://localhost:8000
```

### 2) Frontend Setup
```bash
# New terminal
cd frontend

# Install deps
pnpm install

# Create your env file
cp .env.local.example .env.local
# → Edit .env.local and set the backend URL:
# VITE_API_URL=http://localhost:8000

# Run the dev server
pnpm run dev
# App at http://localhost:5173
```

## Environment Variables

### Backend (`backend/.env`)

``` bash
# Your Supabase (or other) PostgreSQL connection string
DATABASE_URL=postgresql+psycopg://postgres:[YOUR-PASSWORD]@[INSTANCE-HOST]:5432/postgres

# A long, random string for signing JWTs
JWT_SECRET=your_super_secret_key_here

# Comma-separated list of allowed origins (frontend URLs)
CORS_ORIGINS=http://localhost:5173,https://pantry-pal-neon.vercel.app

# Brevo API key for password reset emails
BREVO_API_KEY=xkeysib-your-brevo-api-key-here
EMAIL_FROM=your-verified-sender@example.com

# Gemini API key for AI recipe ideas (https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-api-key-here
# Gemini model used for recipes
GEMINI_MODEL=gemini-3.8-flash
# Tried once when the main model is overloaded (503); leave empty to disable
GEMINI_FALLBACK_MODEL=gemini-3.5-flash
# Max seconds to wait for one Gemini request
GEMINI_TIMEOUT_SECONDS=60
# Max recipe generations per day across ALL users (cost safety net)
RECIPE_GLOBAL_DAILY_LIMIT=500
```

If `GEMINI_API_KEY` is not set, the rest of the app works normally and the recipe endpoint returns a "not configured" error.

### Frontend (`frontend/.env.local`)

``` bash
# The URL of your deployed backend
VITE_API_URL=https://pantry-pal-trw5.onrender.com
```