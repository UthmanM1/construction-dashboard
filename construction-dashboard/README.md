# Construction Data Tracking Dashboard

A full-stack web application for construction teams to track employee activity, project status, and equipment usage — all from a single command-center dashboard.

## Features

- **Three Core Data Streams**: Employee activity, project status, equipment usage
- **Role-Based Access Control**: Foremen (log data), Managers (approve/edit), Admins (full control)
- **Real-Time Dashboard**: Live summaries, colour-coded alerts, drill-down history
- **Document Archive**: Upload and store project documents, searchable indefinitely
- **Filters**: Date range, project site, crew
- **No Data Loss**: Records are archived, never deleted

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Frontend | React + Vite |
| Auth | JWT (JSON Web Tokens) |
| File Storage | Local (easily swappable to AWS S3) |
| Styling | Tailwind CSS |

## Project Structure

```
construction-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, env config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, role checks
│   │   ├── models/         # DB query functions
│   │   └── routes/         # API routes
│   ├── migrations/         # SQL schema files
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # Auth context
│   │   └── utils/          # API helpers
│   └── index.html
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/construction-dashboard.git
cd construction-dashboard
```

### 2. Set up the backend
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run migrate
npm run dev
```

### 3. Set up the frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Or use Docker
```bash
docker-compose up --build
```

The app will be available at `http://localhost:5173`

## Default Admin Login
```
Email:    admin@construction.com
Password: Admin1234!
```
> Change this immediately after first login.

## API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout

### Employees
- `GET /api/employees` — List all
- `POST /api/employees/activity` — Log activity
- `GET /api/employees/activity?date=&site=&crew=` — Filter activity

### Projects
- `GET /api/projects` — List all projects
- `POST /api/projects` — Create project
- `PUT /api/projects/:id` — Update status
- `GET /api/projects/:id/history` — Full history trail

### Equipment
- `GET /api/equipment` — List all equipment
- `POST /api/equipment/usage` — Log usage
- `GET /api/equipment/usage?date=&site=` — Filter usage

### Documents
- `POST /api/documents/upload` — Upload document
- `GET /api/documents?project=&search=` — Search archive
- `GET /api/documents/:id/download` — Download file

### Dashboard
- `GET /api/dashboard/summary` — Live summary stats
- `GET /api/dashboard/alerts` — Active alerts

## Database Schema

See `backend/migrations/` for full SQL schema.

Core tables:
- `users` — Auth and roles
- `projects` — Project records
- `employee_activity` — Daily activity logs
- `equipment` — Equipment registry
- `equipment_usage` — Usage logs
- `documents` — Document archive metadata

## License
MIT
