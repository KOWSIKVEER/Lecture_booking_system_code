const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const StudentCourseMapping = require('../models/StudentCourseMapping');
const Notification = require('../models/Notification');

/**
 * @route   GET /api/assignments
 * @desc    Get assignments (student: enrolled courses; faculty: own assignments)
 * @access  Private
 */
const getAssignments = async (req, res, next) => {
  try {
    const { course, page = 1, limit = 20 } = req.query;
    let filter = { isActive: true };
    if (course) filter.course = course;

    if (req.user.role === 'faculty' || req.user.role === 'admin') {
      if (req.user.role !== 'admin') filter.faculty = req.faculty._id;
    } else {
      // Student: get assignments for enrolled courses
      const enrollments = await StudentCourseMapping.find({ student: req.student._id, isActive: true });
      const courseIds = enrollments.map(e => e.course);
      filter.course = { $in: courseIds };
    }

    const assignments = await Assignment.find(filter)
      .populate('course', 'name courseId')
      .populate('faculty', 'name facultyId')
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments(filter);

    // For students, attach submission status
    if (req.user.role === 'student') {
      const assignmentIds = assignments.map(a => a._id);
      const submissions = await AssignmentSubmission.find({
        assignment: { $in: assignmentIds },
        student: req.student._id
      });
      const submissionMap = {};
      submissions.forEach(s => { submissionMap[s.assignment.toString()] = s; });

      const now = new Date();
      const enriched = assignments.map(a => {
        const sub = submissionMap[a._id.toString()];
        let status = 'due';
        if (sub) status = sub.status;
        else if (a.dueDate < now) status = 'missed';

        return { ...a.toJSON(), submission: sub || null, status };
      });

      return res.json({
        success: true,
        data: enriched,
        pagination: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    }

    res.json({
      success: true,
      data: assignments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/assignments
 * @desc    Create assignment (Coordinator only)
 * @access  Coordinator
 */
const createAssignment = async (req, res, next) => {
  try {
    const { title, description, course, dueDate, totalMarks } = req.body;

    const attachments = req.files?.map(f => ({
      filename: f.filename,
      path: f.path,
      mimetype: f.mimetype
    })) || [];

    const assignment = await Assignment.create({
      title,
      description,
      course,
      faculty: req.faculty._id,
      dueDate,
      totalMarks: totalMarks || 100,
      attachments
    });

    // Notify enrolled students
    const enrollments = await StudentCourseMapping.find({ course, isActive: true });
    const notifications = enrollments.map(e => ({
      recipientType: 'Student',
      recipient: e.student,
      title: 'New Assignment',
      message: `New assignment "${title}" has been posted.`,
      type: 'assignment',
      relatedId: assignment._id
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({ success: true, message: 'Assignment created.', data: assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/assignments/:id/submit
 * @desc    Submit assignment (Student)
 * @access  Student
 */
const submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    const files = req.files?.map(f => ({
      filename: f.filename,
      path: f.path,
      mimetype: f.mimetype
    })) || [];

    const now = new Date();
    const isLate = now > assignment.dueDate;

    const existing = await AssignmentSubmission.findOne({
      assignment: req.params.id,
      student: req.student._id
    });

    if (existing) {
      existing.files = files;
      existing.remarks = req.body.remarks;
      existing.submittedAt = now;
      existing.status = isLate ? 'late' : 'submitted';
      await existing.save();
      return res.json({ success: true, message: 'Submission updated.', data: existing });
    }

    const submission = await AssignmentSubmission.create({
      assignment: req.params.id,
      student: req.student._id,
      files,
      remarks: req.body.remarks,
      status: isLate ? 'late' : 'submitted'
    });

    res.status(201).json({ success: true, message: 'Assignment submitted.', data: submission });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/assignments/:id/grade/:submissionId
 * @desc    Grade a submission (Faculty)
 * @access  Faculty
 */
const gradeSubmission = async (req, res, next) => {
  try {
    const { marks, feedback } = req.body;

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      req.params.submissionId,
      {
        marks,
        feedback,
        status: 'graded',
        gradedBy: req.faculty._id,
        gradedAt: new Date()
      },
      { new: true }
    );

    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    res.json({ success: true, message: 'Submission graded.', data: submission });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/assignments/:id/submissions
 * @desc    Get all submissions for an assignment (Faculty)
 * @access  Faculty
 */
const getSubmissions = async (req, res, next) => {
  try {
    const submissions = await AssignmentSubmission.find({ assignment: req.params.id })
      .populate('student', 'name rollNumber department');

    res.json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAssignments, createAssignment, submitAssignment, gradeSubmission, getSubmissions };
