const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  getStudents, createStudent, updateStudent, deleteStudent,
  getFaculties, createFaculty, updateFaculty, deleteFaculty,
  getDashboardAnalytics, getCourses, createCourse, updateCourse, deleteCourse, enrollStudent
} = require('../controllers/adminController');

// Analytics
router.get('/analytics', authenticate, adminOnly, getDashboardAnalytics);

// Students
router.get('/students', authenticate, adminOnly, getStudents);
router.post('/students', authenticate, adminOnly, createStudent);
router.put('/students/:id', authenticate, adminOnly, updateStudent);
router.delete('/students/:id', authenticate, adminOnly, deleteStudent);

// Faculty
router.get('/faculty', authenticate, adminOnly, getFaculties);
router.post('/faculty', authenticate, adminOnly, createFaculty);
router.put('/faculty/:id', authenticate, adminOnly, updateFaculty);
router.delete('/faculty/:id', authenticate, adminOnly, deleteFaculty);

// Courses
router.get('/courses', authenticate, adminOnly, getCourses);
router.post('/courses', authenticate, adminOnly, createCourse);
router.put('/courses/:id', authenticate, adminOnly, updateCourse);
router.delete('/courses/:id', authenticate, adminOnly, deleteCourse);

// Enrollment
router.post('/enroll', authenticate, adminOnly, enrollStudent);

module.exports = router;
