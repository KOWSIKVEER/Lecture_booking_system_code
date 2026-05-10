const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { studentLogin, facultyLogin, logout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/student/login', [
  body('rollNumber').notEmpty().withMessage('Roll number is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, studentLogin);

router.post('/faculty/login', [
  body('facultyId').notEmpty().withMessage('Faculty ID is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, facultyLogin);

router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
