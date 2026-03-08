# School Management System - Client App

Full-stack application for parents and students to manage school activities.

## Structure

```
school-client-app/
├── frontend/          # React.js (Vite) - Port 3000
├── backend/           # Node.js/Express - Port 5000
├── .env.example
└── README.md
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/docs

## Features

### For Parents
- View children's grades and attendance
- Manage fee payments
- Receive notifications
- View class timetables

### For Students
- View own grades and attendance
- Check fee balance
- Access class schedule
- Receive notifications

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, React Router, Zustand, React Query
- **Backend**: Node.js, Express.js, Prisma, PostgreSQL
- **Auth**: JWT with device verification
- **Security**: SHA-512 hashing, rate limiting, helmet

## Default Credentials

After seeding (if implemented):
- Student: student@school.com / Password123!
- Parent: parent@school.com / Password123!

## Development Notes

- Device verification required on first login
- Admin must approve devices before full access
- Fee balance threshold: 5000 RWF
- Session timeout: 15 minutes (access token)

## Testing

```bash
cd backend
npm test
```

## Production Build

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```
