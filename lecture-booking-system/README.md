# Lecture Booking System

A full-stack MERN application for managing lecture bookings with role-based access control.

## Tech Stack

- **Frontend**: React.js + Tailwind CSS + Redux Toolkit + React Router + Axios
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **Charts**: Chart.js + react-chartjs-2

## Roles

| Role | Access | Login ID |
|------|--------|----------|
| Student | Student portal | Roll Number |
| Faculty | Faculty portal | Faculty ID |
| Admin | Full admin panel | Faculty ID = `-1` |

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally or MongoDB Atlas URI

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run seed    # Seed demo data
npm run dev     # Start backend on port 5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start       # Start frontend on port 3000
```

## Demo Credentials

| Role | ID | Password |
|------|----|----------|
| Student | S2021001 | student123 |
| Faculty | F001 | faculty123 |
| Admin | -1 | admin123 |

## Project Structure

```
lecture-booking-system/
├── backend/
│   ├── config/          # Database config
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, error, upload middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── scripts/         # Seed script
│   ├── uploads/         # File uploads (auto-created)
│   └── server.js        # Entry point
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Reusable UI components
        ├── layouts/     # Page layouts with sidebar
        ├── pages/       # Page components
        │   ├── student/ # Student portal pages
        │   ├── faculty/ # Faculty portal pages
        │   └── admin/   # Admin panel pages
        ├── services/    # API + Socket.IO
        └── store/       # Redux store + slices
```

## API Endpoints

### Auth
- `POST /api/auth/student/login`
- `POST /api/auth/faculty/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Classes
- `GET    /api/classes` — List with recommendation sorting
- `POST   /api/classes` — Create (Faculty)
- `PUT    /api/classes/:id` — Update
- `DELETE /api/classes/:id` — Cancel
- `POST   /api/classes/:id/start` — Start class
- `POST   /api/classes/:id/end` — End class

### Bookings
- `GET    /api/bookings/my-bookings`
- `POST   /api/bookings` — Book a class
- `DELETE /api/bookings/:id` — Cancel booking

### Attendance
- `GET  /api/attendance/my-attendance`
- `POST /api/attendance/mark` — Mark attendance (Faculty)

### Assignments
- `GET  /api/assignments`
- `POST /api/assignments` — Create (Coordinator)
- `POST /api/assignments/:id/submit` — Submit (Student)
- `POST /api/assignments/:id/grade/:submissionId` — Grade (Faculty)

### Notes
- `GET  /api/notes`
- `POST /api/notes` — Upload (Faculty)
- `POST /api/notes/:id/summarize` — AI summarize

### Forums
- `GET  /api/forums`
- `POST /api/forums` — Create post
- `POST /api/forums/:id/reply`
- `POST /api/forums/:id/like`

### Admin
- `GET /api/admin/analytics`
- CRUD for students, faculty, courses, timetables

## Features

- JWT authentication with protected routes
- Role-based access (Student / Faculty / Admin)
- Recommendation engine for class suggestions
- Attendance tracking with analytics charts
- Assignment submission and grading
- Notes with AI summarizer placeholder
- Real-time forums via Socket.IO
- Dark/light mode
- Responsive design
- Loading skeletons
- Toast notifications
- File uploads (PDF, DOC, images)
- Pagination on all list views
- Search and filter everywhere

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lecture_booking_system
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```
