const express = require('express');
const router = express.Router();
const { authenticate, facultyOnly, adminOnly } = require('../middleware/auth');
const {
  getMyTimetable, getFacultyTimetable, createTimetableEntry,
  updateTimetableEntry, deleteTimetableEntry, scheduleNextClass
} = require('../controllers/timetableController');

router.get('/my-timetable', authenticate, facultyOnly, getMyTimetable);
router.get('/faculty/:facultyId', authenticate, adminOnly, getFacultyTimetable);
router.post('/', authenticate, adminOnly, createTimetableEntry);
router.put('/:id', authenticate, adminOnly, updateTimetableEntry);
router.delete('/:id', authenticate, adminOnly, deleteTimetableEntry);
router.post('/schedule-class', authenticate, facultyOnly, scheduleNextClass);

module.exports = router;
