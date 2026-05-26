# ScopeSync - ESG Data Management Platform

**Live Demo:** [https://scope-sync-two.vercel.app/](https://scope-sync-two.vercel.app/)

ScopeSync is an enterprise-grade Environmental, Social, and Governance (ESG) data ingestion and normalization platform. It provides a robust, auditable pipeline for uploading raw operational data (like SAP fuel extracts, utility bills, and corporate travel logs), normalizing it into standard CO2e equivalents, and enforcing a strict analyst review lifecycle.

## Features
- **Multi-Tenant Architecture:** Secure data isolation using PostgreSQL.
- **Robust Ingestion Pipeline:** Automated parsing and delimiter detection for messy enterprise CSV exports.
- **Anomaly Detection:** Automatic flagging of statistically improbable or malformed records.
- **Review Lifecycle:** "Human-in-the-loop" approval workflow for flagged records.
- **Immutable Audit Trail:** Append-only audit logging of all state changes and value edits for strict compliance auditing.
- **Real-time Analytics:** Dynamic Dashboard and GHG protocol scope categorization (Scope 1, 2, 3).

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Python, Django, Django REST Framework, pandas
- **Database:** SQLite (Local) / PostgreSQL (Production)
- **Deployment:** Vercel (Frontend) & Render (Backend)

## Local Development Setup

### 1. Backend (Django)
Navigate to the `backend` directory, create a virtual environment, and install dependencies:
```bash
cd backend
python -m venv venv
# On Windows use: venv\Scripts\activate
# On Mac/Linux use: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
The backend API will run on `http://localhost:8000`.

### 2. Frontend (React/Vite)
Open a new terminal, navigate to the `frontend` directory, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Architecture & Engineering Documentation
For deep dives into the engineering decisions, tradeoffs, and data modeling, please read the following documentation files located in the root directory:
- [MODEL.md](./MODEL.md): Database architecture and schema design.
- [DECISIONS.md](./DECISIONS.md): Architectural decisions and product assumptions.
- [SOURCES.md](./SOURCES.md): Real-world ESG data source research.
- [TRADEOFFS.md](./TRADEOFFS.md): Intentional scope limitations and technical tradeoffs.

## Deployment Details
- **Backend (Render):** Uses `build.sh` to install dependencies, run migrations, and collect static files. Served via Gunicorn and Whitenoise.
- **Frontend (Vercel):** Standard Vite deployment. Connects to the backend via the `VITE_API_BASE_URL` environment variable.
