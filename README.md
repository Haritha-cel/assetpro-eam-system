# AssetPro — Enterprise Asset Management System

A production-grade full-stack application built to demonstrate enterprise software skills for companies like IFS.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Recharts, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| API Docs | Swagger / OpenAPI 3.0 |
| Testing | Jest |

## What This Demonstrates
| Skill | Implementation |
|---|---|
| PostgreSQL design | 7 normalized tables, ENUMs, CHECK constraints, triggers, indexes |
| Complex SQL | JOINs, GROUP BY, aggregates, transactions with ROLLBACK |
| RBAC | JWT roles (admin/manager/technician) enforced at middleware AND service layer |
| Business logic | WO completion = atomic transaction: parts deduction + asset update + maintenance reset + audit |
| REST API | 4-layer architecture: Controller → Service → Repository → PostgreSQL |
| Audit trail | Append-only audit_logs table for every state change |
| Testing | Jest unit tests for RBAC and business logic (no real DB needed) |

## Quick Start

### 1. Database setup
Open pgAdmin → Query Tool → paste and run `docs/schema.sql`

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env        # fill in your DB password
node src/config/seed.js     # seed sample data
npm run dev                 # starts on port 5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # starts on port 3000
```

### 4. Open the app
- **App:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:5000/api-docs

### 5. Run tests
```bash
cd backend
npm test
```

## Demo Credentials (password: `Password123!`)
| Role | Email |
|---|---|
| Admin | admin@assetpro.com |
| Manager | manager@assetpro.com |
| Technician | priya@assetpro.com |

## Project Structure
```
assetpro/
├── backend/src/
│   ├── config/         # DB connection, seed, swagger
│   ├── middleware/      # JWT auth + RBAC
│   ├── repositories/   # All SQL queries
│   ├── services/       # Business logic + RBAC enforcement
│   ├── controllers/    # HTTP request/response
│   └── routes/         # Route definitions + Swagger JSDoc
├── frontend/src/
│   ├── context/        # Auth state (JWT)
│   ├── services/       # Axios + JWT interceptor
│   └── pages/          # Login, Dashboard, Assets, Work Orders,
│                       # Maintenance, Parts, Users, Audit
└── docs/
    └── schema.sql      # Full PostgreSQL schema
```

## Key Business Logic — Work Order Completion
Completing a WO runs a single PostgreSQL transaction:
1. Mark WO as `completed`
2. Deduct required spare parts (with stock check)
3. Mark asset as `active`
4. Reset maintenance schedule `last_service_hours`
5. Append audit log entries
6. **ROLLBACK** on any failure — all or nothing
