const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const StudentCourseMapping = require('../models/StudentCourseMapping');
const AcademicPerformance = require('../models/AcademicPerformance');
const Attendance = require('../models/Attendance');

/**
 * @route   GET /api/profile/student
 * @desc    Get student profile with full details
 * @access  Student
 */
const getStudentProfile = async (req, res, next) => {
  try {
    const student = req.student;

    // Get enrolled courses
    const enrollments = await StudentCourseMapping.find({ student: student._id, isActive: true })
      .populate('course', 'name courseId department credits');

    // Get attendance stats
    const attendanceStats = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } }
        }
      }
    ]);

    const attendancePct = attendanceStats.length > 0
      ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100 * 100) / 100
      : 0;

    // Get academic performance
    const performance = await AcademicPerformance.find({ student: student._id })
      .populate('course', 'name courseId');

    res.json({
      success: true,
      data: {
        ...student.toJSON(),
        enrolledCourses: enrollments,
        attendancePercentage: attendancePct,
        academicPerformance: performance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/profile/student
 * @desc    Update student profile
 * @access  Student
 */
const updateStudentProfile = async (req, res, next) => {
  try {
    const { name, contact, dob } = req.body;
    const updateData = { name, contact, dob };

    if (req.file) {
      updateData.photo = req.file.path;
    }

    const student = await Student.findByIdAndUpdate(req.student._id, updateData, { new: true });
    res.json({ success: true, message: 'Profile updated.', data: student });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/profile/faculty
 * @desc    Get faculty profile
 * @access  Faculty
 */
const getFacultyProfile = async (req, res, next) => {
  try {
    const faculty = req.faculty;

    // Get courses handled
    const Course = require('../models/Course');
    const courses = await Course.find({ coordinator: faculty._id, isActive: true });

    // Get timetable overview
    const Timetable = require('../models/Timetable');
    const timetable = await Timetable.find({ faculty: faculty._id, isActive: true })
      .populate('course', 'name courseId');

    res.json({
      success: true,
      data: {
        ...faculty.toJSON(),
        coursesHandling: courses,
        timetableOverview: timetable
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/profile/faculty
 * @desc    Update faculty profile
 * @access  Faculty
 */
const updateFacultyProfile = async (req, res, next) => {
  try {
    const { name, contact, dob, specialization } = req.body;
    const updateData = { name, contact, dob, specialization };

    if (req.file) {
      updateData.photo = req.file.path;
    }

    const faculty = await Faculty.findByIdAndUpdate(req.faculty._id, updateData, { new: true });
    res.json({ success: true, message: 'Profile updated.', data: faculty });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/profile/change-password
 * @desc    Change password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const isStudent = req.user.role === 'student';
    const user = isStudent ? req.student : req.faculty;
    const Model = isStudent ? Student : Faculty;

    const userWithPass = await Model.findById(user._id);
    const isMatch = await userWithPass.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    userWithPass.password = newPassword;
    await userWithPass.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStudentProfile, updateStudentProfile, getFacultyProfile, updateFacultyProfile, changePassword };
