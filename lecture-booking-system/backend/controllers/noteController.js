const Note = require('../models/Note');
const StudentCourseMapping = require('../models/StudentCourseMapping');
const Notification = require('../models/Notification');
const { summarizeWithGroq } = require('../services/aiSummarizer');

/**
 * @route   GET /api/notes
 * @desc    Get notes (filtered by course, search)
 * @access  Private
 */
const getNotes = async (req, res, next) => {
  try {
    const { course, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (course) filter.course = course;

    if (search) {
      filter.$text = { $search: search };
    }

    // Students only see notes for enrolled courses
    if (req.user.role === 'student') {
      const enrollments = await StudentCourseMapping.find({ student: req.student._id, isActive: true });
      const courseIds = enrollments.map(e => e.course);
      filter.course = course ? course : { $in: courseIds };
    }

    const notes = await Note.find(filter)
      .populate('course', 'name courseId')
      .populate('faculty', 'name facultyId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Note.countDocuments(filter);

    res.json({
      success: true,
      data: notes,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notes
 * @desc    Upload notes (Faculty - coordinator for official)
 * @access  Faculty
 */
const uploadNote = async (req, res, next) => {
  try {
    const { title, description, course, tags } = req.body;
    const isCoordinator = req.faculty?.is_coordinator || req.user.role === 'admin';

    const files = req.files?.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      path: f.path,
      mimetype: f.mimetype,
      size: f.size
    })) || [];

    const note = await Note.create({
      title,
      description,
      course,
      faculty: req.faculty._id,
      type: isCoordinator ? 'official' : 'personal',
      files,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    // Notify enrolled students
    const enrollments = await StudentCourseMapping.find({ course, isActive: true });
    const notifications = enrollments.map(e => ({
      recipientType: 'Student',
      recipient: e.student,
      title: 'New Notes Available',
      message: `New notes "${title}" have been uploaded.`,
      type: 'note',
      relatedId: note._id
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({ success: true, message: 'Notes uploaded.', data: note });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notes/:id/summarize
 * @desc    AI summarize notes (placeholder)
 * @access  Student
 */
const summarizeNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    // Generate AI summary using Groq LLM
    const textToSummarize = `${note.title}\n${note.description || ''}`;
    const aiSummary = await summarizeWithGroq(textToSummarize);
    note.summary = aiSummary;
    note.summaryGeneratedAt = new Date();
    await note.save();

    res.json({ success: true, message: 'Summary generated.', data: { summary: aiSummary } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes/:id/download
 * @desc    Download note file
 * @access  Private
 */
const downloadNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    await Note.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });

    res.json({ success: true, data: note.files });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete note
 * @access  Faculty
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    if (note.faculty.toString() !== req.faculty._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Note.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Note deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotes, uploadNote, summarizeNote, downloadNote, deleteNote };
