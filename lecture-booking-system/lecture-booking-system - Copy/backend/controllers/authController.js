const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const UserSession = require('../models/UserSession');

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @route   POST /api/auth/student/login
 * @desc    Student login
 * @access  Public
 */
const studentLogin = async (req, res, next) => {
  try {
    const { rollNumber, password } = req.body;

    const student = await Student.findOne({ rollNumber, isActive: true });
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid roll number or password.' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid roll number or password.' });
    }

    const token = generateToken({
      id: student._id,
      role: 'student',
      rollNumber: student.rollNumber
    });

    // Save session
    await UserSession.create({
      userId: student._id,
      userType: 'Student',
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { ...student.toJSON(), role: 'student' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/faculty/login
 * @desc    Faculty/Admin login
 * @access  Public
 */
const facultyLogin = async (req, res, next) => {
  try {
    const { facultyId, password } = req.body;

    const faculty = await Faculty.findOne({ facultyId, isActive: true });
    if (!faculty) {
      return res.status(401).json({ success: false, message: 'Invalid faculty ID or password.' });
    }

    const isMatch = await faculty.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid faculty ID or password.' });
    }

    // Admin has facultyId = -1
    const role = faculty.isAdmin ? 'admin' : 'faculty';

    const token = generateToken({
      id: faculty._id,
      role,
      facultyId: faculty.facultyId
    });

    await UserSession.create({
      userId: faculty._id,
      userType: 'Faculty',
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { ...faculty.toJSON(), role }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await UserSession.findOneAndUpdate({ token }, { isActive: false });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
const getMe = async (req, res) => {
  const user = req.student || req.faculty;
  res.json({
    success: true,
    user: { ...user.toJSON(), role: req.user.role }
  });
};

module.exports = { studentLogin, facultyLogin, logout, getMe };
