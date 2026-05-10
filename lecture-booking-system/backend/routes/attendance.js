const express = require('express');
const router = express.Router();
const { authenticate, studentOnly, facultyOnly, adminOnly } = require('../middleware/auth');
const { getMyAttendance, markAttendance, getClassAttendance, getAttendanceAnalytics } = require('../controllers/attendanceController');

router.get('/my-attendance', authenticate, studentOnly, getMyAttendance);
router.get('/analytics', authenticate, adminOnly, getAttendanceAnalytics);
router.get('/class/:classId', authenticate, facultyOnly, getClassAttendance);
router.post('/mark', authenticate, facultyOnly, markAttendance);

module.exports = router;
