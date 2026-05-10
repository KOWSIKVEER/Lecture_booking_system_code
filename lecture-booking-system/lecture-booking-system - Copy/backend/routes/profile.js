const express = require('express');
const router = express.Router();
const { authenticate, studentOnly, facultyOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getStudentProfile, updateStudentProfile,
  getFacultyProfile, updateFacultyProfile, changePassword
} = require('../controllers/profileController');

router.get('/student', authenticate, studentOnly, getStudentProfile);
router.put('/student', authenticate, studentOnly, upload.single('photo'), updateStudentProfile);
router.get('/faculty', authenticate, facultyOnly, getFacultyProfile);
router.put('/faculty', authenticate, facultyOnly, upload.single('photo'), updateFacultyProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
