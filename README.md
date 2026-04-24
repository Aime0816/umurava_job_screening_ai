# Umurava Job Screening AI

AI-assisted candidate screening platform built with `Next.js`, `Tailwind CSS`, `Redux Toolkit`, `Express`, and `MongoDB`.

## Overview

This system helps recruiters:

- create and manage jobs
- ingest candidate profiles from JSON, PDF, CSV, and Excel
- run AI-assisted screening and ranking
- review explainable candidate recommendations
- protect recruiter workflows behind authenticated access

The repository is split into a frontend application in `frontend/` and a backend API in `backend/`.

## System Analysis

### Frontend

The frontend is a `Next.js 14` App Router application written in `TypeScript`.

- UI styling is built with `Tailwind CSS`
- global state is handled with `Redux Toolkit`
- API communication uses `axios`
- route/session protection is handled through `Next.js middleware` plus a client auth provider
- the login screen and main workspace are implemented as protected client-side flows

The visual system uses a custom Tailwind theme in [frontend/tailwind.config.js](/abs/path/c:/Users/User/Documents/umurava_job_screening_ai/frontend/tailwind.config.js) with:

- brand color tokens
- surface colors for dark UI panels
- custom font families
- shared motion utilities

### Backend

The backend is an `Express` API written in `TypeScript` and backed by `MongoDB` via `Mongoose`.

- `helmet` hardens HTTP headers
- `cors` restricts allowed origins
- `express-rate-limit` protects `/api/*`
- JWT auth protects all `/api/v1/*` routes except `/api/v1/auth/login`
- uploaded files under `/uploads` are protected by auth middleware
- request payload validation uses `zod`

### AI Screening Flow

The screening flow is:

1. Create or select a job.
2. Import or create candidate profiles.
3. Persist job and candidate records in MongoDB.
4. Trigger `/api/v1/screenings`.
5. The backend fetches job and candidate records.
6. The AI service evaluates candidates.
7. Results are ranked, persisted, and attached back to candidate AI score history.
8. The frontend renders rankings and recruiter-facing summaries.

### Authentication Flow

The current auth model is single-role admin access.

- backend bootstraps an admin user if `ADMIN_EMAIL` does not already exist
- login returns a JWT plus user metadata
- frontend stores session state in `localStorage` and a cookie
- `frontend/src/middleware.ts` redirects anonymous users to `/login`
- authenticated API calls attach `Authorization: Bearer <token>`

Default bootstrap credentials:

- email: `admin@umurava.local`
- password: `Admin@12345`

These should be changed through environment variables in any non-local environment.

## Architecture

```text
umurava_job_screening_ai/
|-- backend/
|   |-- src/
|   |   |-- config/        # database and logger setup
|   |   |-- controllers/   # route handlers
|   |   |-- middleware/    # auth, validation, error handling
|   |   |-- models/        # mongoose schemas
|   |   |-- routes/        # API route wiring
|   |   |-- services/      # AI screening, resume parsing, bootstrap services
|   |   `-- utils/         # seed and utility scripts
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- app/           # Next.js app router pages and layout
|   |   |-- components/    # feature and shared UI components
|   |   |-- hooks/         # typed redux hooks
|   |   |-- lib/           # API client and auth storage helpers
|   |   |-- store/         # Redux store and slices
|   |   `-- types/         # shared frontend domain types
|   |-- .env.local.example
|   |-- tailwind.config.js
|   `-- package.json
|-- docker-compose.yml
`-- README.md
```

## Tech Stack

### Frontend stack

- `Next.js 14`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `Redux Toolkit`
- `Framer Motion`
- `react-hot-toast`
- `Recharts`

### Backend stack

- `Node.js`
- `Express`
- `TypeScript`
- `MongoDB`
- `Mongoose`
- `jsonwebtoken`
- `bcryptjs`
- `multer`
- `zod`

## Key Modules

### Frontend modules

- `src/app/page.tsx`: authenticated workspace shell
- `src/app/login/page.tsx`: modern Tailwind-based login page
- `src/components/auth/AuthProvider.tsx`: session hydration and auth state
- `src/lib/api.ts`: centralized axios client and API helpers
- `src/store/slices/*`: jobs, candidates, screening, and UI state

### Backend modules

- `src/index.ts`: app bootstrap, middleware registration, route mounting
- `src/routes/auth.routes.ts`: login and current-user endpoints
- `src/middleware/auth.ts`: JWT verification middleware
- `src/services/bootstrap-admin.service.ts`: default admin creation
- `src/services/screening.service.ts`: ranking orchestration
- `src/services/resume-parser.service.ts`: file normalization and profile parsing
- `src/services/gemini.service.ts`: AI evaluation implementation and fallback logic

## API Surface

Base URL:

```text
http://localhost:5000/api/v1
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate and receive JWT |
| `GET` | `/auth/me` | Return current authenticated user |

### Jobs

| Method | Endpoint |
|---|---|
| `POST` | `/jobs` |
| `GET` | `/jobs` |
| `GET` | `/jobs/:id` |
| `PUT` | `/jobs/:id` |
| `DELETE` | `/jobs/:id` |

### Candidates

| Method | Endpoint |
|---|---|
| `POST` | `/candidates` |
| `GET` | `/candidates` |
| `GET` | `/candidates/search` |
| `GET` | `/candidates/:id` |
| `PUT` | `/candidates/:id` |
| `DELETE` | `/candidates/:id` |

### Screenings

| Method | Endpoint |
|---|---|
| `POST` | `/screenings` |
| `GET` | `/screenings` |
| `GET` | `/screenings/:id` |
| `GET` | `/screenings/:id/rankings` |

### Uploads

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/upload/cvs` | accepts `.pdf`, `.csv`, `.xlsx`, `.xls` |
| `POST` | `/upload/json` | accepts one profile or an array |

## Environment Configuration

### Backend `.env`

Example values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/umurava_talent_screening
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@umurava.local
ADMIN_PASSWORD=Admin@12345
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Umurava Talent Screening
```

## Local Development

### Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Run the apps

```bash
# backend
cd backend
npm run dev

# frontend
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Docker

The repository includes `docker-compose.yml` for `mongo`, `backend`, and `frontend`.

```bash
docker-compose up --build
```

Default service ports:

- frontend: `3000`
- backend: `5000`
- mongo: `27017`

## Data Model Summary

### Candidate

Core fields include:

- personal identity and contact information
- skills with level and years of experience
- work history
- education
- projects
- certifications
- availability
- AI score history

Reference type source:

- [frontend/src/types/index.ts](/abs/path/c:/Users/User/Documents/umurava_job_screening_ai/frontend/src/types/index.ts)

### Job

Core fields include:

- title and department
- description
- required skills
- optional nice-to-have skills
- seniority
- employment type
- scoring weights
- status

### Screening

Core fields include:

- job reference
- candidate references
- ranked results
- score breakdowns
- tier classification
- reasoning and recommendation
- processing metadata

## Security Notes

- all business API routes under `/api/v1` are protected
- uploads are not publicly exposed
- passwords are hashed before persistence
- API requests are rate limited
- the admin account is convenient for local development but should be replaced in staging and production

## Operational Notes

- frontend type-check currently passes with `npm.cmd run type-check`
- auth-related backend TypeScript compilation passes
- the full backend build may still be blocked by existing syntax issues in `backend/src/utils/seeder.ts`
- the AI service currently uses `Gemini-2.5-flash` first and falls back to `gemini-1.5-flash`


## Documentation Standards

All future documentation for this repository should follow these standards.

### Source of truth

- document the implementation that exists, not the implementation we plan to build
- when behavior changes, update `README.md` in the same change set
- prefer pointing to concrete files, modules, and environment variables

### Structure

- start with purpose and system context
- describe architecture before endpoint or file-level detail
- use short sections with clear titles
- keep command examples copy-paste ready

### Accuracy

- name frameworks and services exactly as configured in code
- distinguish confirmed behavior from intended behavior
- call out known limitations and temporary inconsistencies explicitly
- include auth and security expectations whenever access rules change

### Code and API references

- reference real paths when mentioning modules
- use tables for endpoint inventories
- use fenced code blocks for commands, JSON, and env examples
- keep examples minimal but valid

### Style

- prefer plain technical language over marketing language
- keep terminology consistent across frontend, backend, and API sections
- avoid ambiguous phrases like "simple", "robust", or "scalable" unless backed by specifics
- use ASCII-friendly Markdown where possible

### Maintenance rules

- update environment variable docs whenever `.env.example`, `.env.local.example`, or `docker-compose.yml` changes
- update route docs whenever route files change
- update auth documentation whenever login, token, role, or middleware behavior changes
- update architecture notes whenever core folders or ownership boundaries change

## Suggested Next Improvements

- fix `backend/src/utils/seeder.ts` so the full backend build passes
- add role-based authorization if multiple recruiter roles are needed
- add automated API documentation generation or OpenAPI specs

## License

MIT
