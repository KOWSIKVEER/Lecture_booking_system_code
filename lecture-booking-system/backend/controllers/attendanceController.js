const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Booking = require('../models/Booking');
const StudentCourseMapping = require('../models/StudentCourseMapping');

/**
 * @route   GET /api/attendance/my-attendance
 * @desc    Get student's attendance course-wise
 * @access  Student
 */
const getMyAttendance = async (req, res, next) => {
  try {
    const studentId = req.student._id;

    // Aggregate attendance by course
    const attendanceStats = await Attendance.aggregate([
      { $match: { student: studentId } },
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          course: { _id: '$course._id', name: '$course.name', courseId: '$course.courseId' },
          total: 1,
          present: 1,
          absent: 1,
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2]
          }
        }
      }
    ]);

    // Overall stats
    const overall = attendanceStats.reduce(
      (acc, cur) => {
        acc.total += cur.total;
        acc.present += cur.present;
        return acc;
      },
      { total: 0, present: 0 }
    );
    overall.percentage = overall.total > 0
      ? Math.round((overall.present / overall.total) * 100 * 100) / 100
      : 0;

    res.json({ success: true, data: { courses: attendanceStats, overall } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance for students in a class (Faculty)
 * @access  Faculty
 */
const markAttendance = async (req, res, next) => {
  try {
    const { classId, attendanceList } = req.body;
    // attendanceList: [{ studentId, status }]

    const cls = await Class.findById(classId).populate('course');
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });

    if (cls.faculty.toString() !== req.faculty._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const operations = attendanceList.map(({ studentId, status }) => ({
      updateOne: {
        filter: { student: studentId, class: classId },
        update: {
          $set: {
            student: studentId,
            class: classId,
            course: cls.course._id,
            status,
            markedBy: req.faculty._id,
            markedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);

    // Update booking statuses
    for (const { studentId, status } of attendanceList) {
      const bookingStatus = status === 'present' || status === 'late' ? 'attended' : 'missed';
      await Booking.findOneAndUpdate(
        { student: studentId, class: classId },
        { status: bookingStatus }
      );
    }

    res.json({ success: true, message: 'Attendance marked successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/class/:classId
 * @desc    Get attendance for a specific class
 * @access  Faculty
 */
const getClassAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ class: req.params.classId })
      .populate('student', 'name rollNumber department');

    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attendance/analytics
 * @desc    Get attendance analytics (Admin)
 * @access  Admin
 */
const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const stats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const courseStats = await Attendance.aggregate([
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      },
      {
        $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' }
      },
      { $unwind: '$course' },
      {
        $project: {
          courseName: '$course.name',
          total: 1,
          present: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2] }
        }
      }
    ]);

    res.json({ success: true, data: { overall: stats, byCourse: courseStats } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyAttendance, markAttendance, getClassAttendance, getAttendanceAnalytics };
