const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Booking = require('../models/Booking');
const StudentCourseMapping = require('../models/StudentCourseMapping');

// ─── STUDENT MANAGEMENT ──────────────────────────────────────────────────────

const getStudents = async (req, res, next) => {
  try {
    const { search, department, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const students = await Student.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(filter);

    res.json({ success: true, data: students, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
};

const createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, message: 'Student created.', data: student });
  } catch (error) { next(error); }
};

const updateStudent = async (req, res, next) => {
  try {
    const { password, ...updateData } = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, message: 'Student updated.', data: student });
  } catch (error) { next(error); }
};

const deleteStudent = async (req, res, next) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Student deactivated.' });
  } catch (error) { next(error); }
};

// ─── FACULTY MANAGEMENT ──────────────────────────────────────────────────────

const getFaculties = async (req, res, next) => {
  try {
    const { search, department, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true, isAdmin: false };
    if (department) filter.department = department;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { facultyId: { $regex: search, $options: 'i' } }
    ];

    const faculties = await Faculty.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Faculty.countDocuments(filter);

    res.json({ success: true, data: faculties, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
};

const createFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json({ success: true, message: 'Faculty created.', data: faculty });
  } catch (error) { next(error); }
};

const updateFaculty = async (req, res, next) => {
  try {
    const { password, ...updateData } = req.body;
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.json({ success: true, message: 'Faculty updated.', data: faculty });
  } catch (error) { next(error); }
};

const deleteFaculty = async (req, res, next) => {
  try {
    await Faculty.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Faculty deactivated.' });
  } catch (error) { next(error); }
};

// ─── ANALYTICS DASHBOARD ─────────────────────────────────────────────────────

const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalCourses,
      activeClasses,
      completedClasses,
      totalBookings
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Faculty.countDocuments({ isActive: true, isAdmin: false }),
      Course.countDocuments({ isActive: true }),
      Class.countDocuments({ status: { $in: ['scheduled', 'ongoing'] } }),
      Class.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'booked' })
    ]);

    // Attendance overview
    const attendanceOverview = await Attendance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Department-wise student count
    const deptStats = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly class trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const classTrend = await Class.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: { totalStudents, totalFaculty, totalCourses, activeClasses, completedClasses, totalBookings },
        attendanceOverview,
        departmentStats: deptStats,
        classTrend
      }
    });
  } catch (error) { next(error); }
};

// ─── COURSE MANAGEMENT ───────────────────────────────────────────────────────

const getCourses = async (req, res, next) => {
  try {
    const { search, department, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { courseId: { $regex: search, $options: 'i' } }
    ];

    const courses = await Course.find(filter)
      .populate('coordinator', 'name facultyId')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(filter);

    res.json({ success: true, data: courses, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
};

const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, message: 'Course created.', data: course });
  } catch (error) { next(error); }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.json({ success: true, message: 'Course updated.', data: course });
  } catch (error) { next(error); }
};

const deleteCourse = async (req, res, next) => {
  try {
    await Course.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Course deactivated.' });
  } catch (error) { next(error); }
};

// Enroll student in course
const enrollStudent = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.body;
    const mapping = await StudentCourseMapping.findOneAndUpdate(
      { student: studentId, course: courseId },
      { isActive: true },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Student enrolled.', data: mapping });
  } catch (error) { next(error); }
};

module.exports = {
  getStudents, createStudent, updateStudent, deleteStudent,
  getFaculties, createFaculty, updateFaculty, deleteFaculty,
  getDashboardAnalytics,
  getCourses, createCourse, updateCourse, deleteCourse,
  enrollStudent
};
