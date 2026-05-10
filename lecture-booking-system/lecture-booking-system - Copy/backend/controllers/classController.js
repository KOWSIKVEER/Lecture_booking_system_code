const Class = require('../models/Class');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const StudentCourseMapping = require('../models/StudentCourseMapping');
const AcademicPerformance = require('../models/AcademicPerformance');
const Notification = require('../models/Notification');

/**
 * @route   GET /api/classes
 * @desc    Get all upcoming classes with recommendation sorting for students
 * @access  Private
 */
const getClasses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, course, status = 'scheduled', search } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status };
    if (course) filter.course = course;
    if (search) filter.topic = { $regex: search, $options: 'i' };

    const classes = await Class.find(filter)
      .populate('course', 'name courseId department')
      .populate('faculty', 'name facultyId department')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Class.countDocuments(filter);

    // If student, apply recommendation sorting
    if (req.user.role === 'student') {
      const studentId = req.student._id;

      // Get student's enrolled courses
      const enrollments = await StudentCourseMapping.find({ student: studentId, isActive: true });
      const enrolledCourseIds = enrollments.map(e => e.course.toString());

      // Get attendance percentage
      const attendanceData = await Attendance.aggregate([
        { $match: { student: studentId } },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
      ]);
      const attendancePct = attendanceData.length > 0
        ? (attendanceData[0].present / attendanceData[0].total) * 100
        : 100;

      // Get GPA
      const student = req.student;
      const gpa = student.gpa || 0;

      // Score each class for recommendation
      const scored = classes.map(cls => {
        let score = 0;
        const courseId = cls.course?._id?.toString();

        // Enrolled course gets higher priority
        if (enrolledCourseIds.includes(courseId)) score += 50;

        // Low GPA students get more support class recommendations
        if (gpa < 6) score += 20;

        // Low attendance students get prioritized
        if (attendancePct < 75) score += 15;

        // Rating-based score
        score += (cls.availableSeats > 0 ? 10 : 0);
        score += cls.averageRating * 2;

        return { ...cls.toJSON(), recommendationScore: score };
      });

      scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

      return res.json({
        success: true,
        data: scored,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
      });
    }

    res.json({
      success: true,
      data: classes,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/classes/:id
 * @desc    Get single class
 * @access  Private
 */
const getClassById = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('course', 'name courseId department')
      .populate('faculty', 'name facultyId department designation');

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });

    res.json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/classes
 * @desc    Create a new class (Faculty)
 * @access  Faculty
 */
const createClass = async (req, res, next) => {
  try {
    const { course, topic, description, startTime, endTime, location, minStudents, maxStudents, meetingLink } = req.body;

    const newClass = await Class.create({
      course,
      faculty: req.faculty._id,
      topic,
      description,
      startTime,
      endTime,
      location,
      minStudents: minStudents || 5,
      maxStudents: maxStudents || 60,
      meetingLink
    });

    const populated = await Class.findById(newClass._id)
      .populate('course', 'name courseId')
      .populate('faculty', 'name facultyId');

    // Notify enrolled students
    const enrollments = await StudentCourseMapping.find({ course, isActive: true });
    const notifications = enrollments.map(e => ({
      recipientType: 'Student',
      recipient: e.student,
      title: 'New Class Scheduled',
      message: `A new class "${topic}" has been scheduled.`,
      type: 'class',
      relatedId: newClass._id
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({ success: true, message: 'Class created successfully.', data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/classes/:id
 * @desc    Update class
 * @access  Faculty
 */
const updateClass = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });

    // Only the faculty who created it or admin can update
    if (req.user.role !== 'admin' && cls.faculty.toString() !== req.faculty._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this class.' });
    }

    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('course', 'name courseId')
      .populate('faculty', 'name facultyId');

    res.json({ success: true, message: 'Class updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/classes/:id
 * @desc    Cancel/delete class
 * @access  Faculty/Admin
 */
const deleteClass = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });

    await Class.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true, message: 'Class cancelled.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/classes/faculty/my-classes
 * @desc    Get faculty's classes
 * @access  Faculty
 */
const getFacultyClasses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { faculty: req.faculty._id };
    if (status) filter.status = status;

    const classes = await Class.find(filter)
      .populate('course', 'name courseId')
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Class.countDocuments(filter);

    res.json({
      success: true,
      data: classes,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/classes/:id/students
 * @desc    Get booked students for a class (Faculty)
 * @access  Faculty
 */
const getClassStudents = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ class: req.params.id, status: { $in: ['booked', 'attended'] } })
      .populate('student', 'name rollNumber department year');

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/classes/:id/start
 * @desc    Start a class
 * @access  Faculty
 */
const startClass = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });

    if (cls.faculty.toString() !== req.faculty._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Class.findByIdAndUpdate(req.params.id, { status: 'ongoing' });
    res.json({ success: true, message: 'Class started.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/classes/:id/end
 * @desc    End a class
 * @access  Faculty
 */
const endClass = async (req, res, next) => {
  try {
    await Class.findByIdAndUpdate(req.params.id, { status: 'completed' });
    res.json({ success: true, message: 'Class ended.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getClasses, getClassById, createClass, updateClass, deleteClass, getFacultyClasses, getClassStudents, startClass, endClass };
