const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info from token
    req.user = decoded;

    // Fetch fresh user data
    if (decoded.role === 'student') {
      const student = await Student.findById(decoded.id).select('-password');
      if (!student || !student.isActive) {
        return res.status(401).json({ success: false, message: 'User not found or inactive.' });
      }
      req.student = student;
    } else if (decoded.role === 'faculty' || decoded.role === 'admin') {
      const faculty = await Faculty.findById(decoded.id).select('-password');
      if (!faculty || !faculty.isActive) {
        return res.status(401).json({ success: false, message: 'User not found or inactive.' });
      }
      req.faculty = faculty;
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Restrict access to students only
 */
const studentOnly = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied. Students only.' });
  }
  next();
};

/**
 * Restrict access to faculty only (includes admin)
 */
const facultyOnly = (req, res, next) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Faculty only.' });
  }
  next();
};

/**
 * Restrict access to admin only
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};

/**
 * Restrict access to coordinators only
 */
const coordinatorOnly = (req, res, next) => {
  if (req.user.role === 'admin') return next(); // Admin bypasses
  if (req.user.role !== 'faculty' || !req.faculty?.is_coordinator) {
    return res.status(403).json({ success: false, message: 'Access denied. Coordinators only.' });
  }
  next();
};

module.exports = { authenticate, studentOnly, facultyOnly, adminOnly, coordinatorOnly };
