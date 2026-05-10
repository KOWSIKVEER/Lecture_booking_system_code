const Forum = require('../models/Forum');
const ForumReply = require('../models/ForumReply');

/**
 * @route   GET /api/forums
 * @desc    Get forum posts
 * @access  Private
 */
const getForums = async (req, res, next) => {
  try {
    const { course, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (course) filter.course = course;
    if (search) filter.$text = { $search: search };

    const forums = await Forum.find(filter)
      .populate('course', 'name courseId')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Populate author dynamically
    const Student = require('../models/Student');
    const Faculty = require('../models/Faculty');

    for (const forum of forums) {
      if (forum.authorType === 'Student') {
        forum.authorData = await Student.findById(forum.author).select('name rollNumber photo').lean();
      } else {
        forum.authorData = await Faculty.findById(forum.author).select('name facultyId photo designation').lean();
      }
    }

    const total = await Forum.countDocuments(filter);

    res.json({
      success: true,
      data: forums,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/forums
 * @desc    Create forum post
 * @access  Private
 */
const createForum = async (req, res, next) => {
  try {
    const { title, content, course, tags, isAnnouncement } = req.body;
    const isStudent = req.user.role === 'student';

    const forum = await Forum.create({
      title,
      content,
      course: course || null,
      authorType: isStudent ? 'Student' : 'Faculty',
      author: isStudent ? req.student._id : req.faculty._id,
      tags: tags || [],
      isAnnouncement: !isStudent && isAnnouncement
    });

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit('forum:new', { forumId: forum._id, title });
    }

    res.status(201).json({ success: true, message: 'Post created.', data: forum });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/forums/:id
 * @desc    Get single forum with replies
 * @access  Private
 */
const getForumById = async (req, res, next) => {
  try {
    const forum = await Forum.findById(req.params.id)
      .populate('course', 'name courseId')
      .lean();

    if (!forum) return res.status(404).json({ success: false, message: 'Post not found.' });

    const Student = require('../models/Student');
    const Faculty = require('../models/Faculty');

    if (forum.authorType === 'Student') {
      forum.authorData = await Student.findById(forum.author).select('name rollNumber photo').lean();
    } else {
      forum.authorData = await Faculty.findById(forum.author).select('name facultyId photo designation').lean();
    }

    const replies = await ForumReply.find({ forum: req.params.id, isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    for (const reply of replies) {
      if (reply.authorType === 'Student') {
        reply.authorData = await Student.findById(reply.author).select('name rollNumber photo').lean();
      } else {
        reply.authorData = await Faculty.findById(reply.author).select('name facultyId photo designation').lean();
      }
    }

    res.json({ success: true, data: { ...forum, replies } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/forums/:id/reply
 * @desc    Reply to a forum post
 * @access  Private
 */
const replyToForum = async (req, res, next) => {
  try {
    const { content, parentReply } = req.body;
    const isStudent = req.user.role === 'student';

    const reply = await ForumReply.create({
      forum: req.params.id,
      content,
      authorType: isStudent ? 'Student' : 'Faculty',
      author: isStudent ? req.student._id : req.faculty._id,
      parentReply: parentReply || null
    });

    await Forum.findByIdAndUpdate(req.params.id, { $inc: { replyCount: 1 } });

    // Emit socket event
    if (req.io) {
      req.io.to(`forum:${req.params.id}`).emit('forum:reply', { replyId: reply._id });
    }

    res.status(201).json({ success: true, message: 'Reply posted.', data: reply });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/forums/:id/like
 * @desc    Like/unlike a forum post
 * @access  Private
 */
const likeForum = async (req, res, next) => {
  try {
    const userId = req.user.role === 'student' ? req.student._id : req.faculty._id;
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ success: false, message: 'Post not found.' });

    const alreadyLiked = forum.likes.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      forum.likes = forum.likes.filter(id => id.toString() !== userId.toString());
      forum.likeCount = Math.max(0, forum.likeCount - 1);
    } else {
      forum.likes.push(userId);
      forum.likeCount += 1;
    }

    await forum.save();
    res.json({ success: true, liked: !alreadyLiked, likeCount: forum.likeCount });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/forums/:id
 * @desc    Delete forum post
 * @access  Private (author or admin)
 */
const deleteForum = async (req, res, next) => {
  try {
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ success: false, message: 'Post not found.' });

    await Forum.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getForums, createForum, getForumById, replyToForum, likeForum, deleteForum };
