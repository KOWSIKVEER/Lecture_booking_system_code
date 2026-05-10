const DirectMessage = require('../models/DirectMessage');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

/**
 * @route   GET /api/dm/conversations
 * @desc    Get all conversations for the logged-in user (inbox)
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';
    const filter = isStudent
      ? { student: req.student._id }
      : { faculty: req.faculty._id };

    const conversations = await DirectMessage.find(filter)
      .select('-messages')
      .populate('student', 'name rollNumber department photo')
      .populate('faculty', 'name facultyId department designation photo')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dm/conversations/:conversationId
 * @desc    Get full message thread
 * @access  Private
 */
const getMessages = async (req, res, next) => {
  try {
    const conversation = await DirectMessage.findById(req.params.conversationId)
      .populate('student', 'name rollNumber department photo')
      .populate('faculty', 'name facultyId department designation photo');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Verify the requester is part of this conversation
    const isStudent = req.user.role === 'student';
    const userId = isStudent ? req.student._id.toString() : req.faculty._id.toString();
    const allowed = isStudent
      ? conversation.student._id.toString() === userId
      : conversation.faculty._id.toString() === userId;

    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Mark messages as read for the current user's side
    const senderType = isStudent ? 'Faculty' : 'Student';
    conversation.messages.forEach(msg => {
      if (msg.senderType === senderType && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = new Date();
      }
    });

    if (isStudent) {
      conversation.studentUnread = 0;
    } else {
      conversation.facultyUnread = 0;
    }

    await conversation.save();

    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/dm/send
 * @desc    Send a message (student initiates or replies; faculty replies)
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { facultyId, studentId, text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const isStudent = req.user.role === 'student';

    // Resolve the student and faculty IDs
    let resolvedStudentId, resolvedFacultyId;

    if (isStudent) {
      resolvedStudentId = req.student._id;
      // facultyId is the MongoDB _id of the faculty
      resolvedFacultyId = facultyId;
    } else {
      resolvedFacultyId = req.faculty._id;
      resolvedStudentId = studentId;
    }

    // Find or create conversation
    let conversation = await DirectMessage.findOne({
      student: resolvedStudentId,
      faculty: resolvedFacultyId
    });

    if (!conversation) {
      conversation = new DirectMessage({
        student: resolvedStudentId,
        faculty: resolvedFacultyId,
        messages: []
      });
    }

    // Build the new message
    const newMessage = {
      senderType: isStudent ? 'Student' : 'Faculty',
      sender: isStudent ? req.student._id : req.faculty._id,
      text: text.trim(),
      isRead: false
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = text.trim().substring(0, 100);
    conversation.lastMessageAt = new Date();

    // Increment unread for the OTHER side
    if (isStudent) {
      conversation.facultyUnread += 1;
    } else {
      conversation.studentUnread += 1;
    }

    await conversation.save();

    const savedMsg = conversation.messages[conversation.messages.length - 1];

    // Send real-time event via Socket.IO
    if (req.io) {
      const roomId = `dm:${conversation._id}`;
      req.io.to(roomId).emit('dm:message', {
        conversationId: conversation._id,
        message: savedMsg
      });

      // Notify the other party's personal room
      const notifyRoom = isStudent
        ? `user:${resolvedFacultyId}`
        : `user:${resolvedStudentId}`;

      req.io.to(notifyRoom).emit('dm:notification', {
        conversationId: conversation._id,
        from: isStudent ? req.student.name : req.faculty.name,
        preview: text.trim().substring(0, 60)
      });
    }

    // Persist a notification for the recipient
    const recipientType = isStudent ? 'Faculty' : 'Student'; // wrong — fix below
    // Faculty receives notification when student sends, and vice versa
    await Notification.create({
      recipientType: isStudent ? 'Faculty' : 'Student',
      recipient: isStudent ? resolvedFacultyId : resolvedStudentId,
      title: isStudent ? `New message from ${req.student.name}` : `Reply from ${req.faculty.name}`,
      message: text.trim().substring(0, 100),
      type: 'general',
      relatedId: conversation._id
    });

    res.status(201).json({
      success: true,
      message: 'Message sent.',
      data: {
        conversationId: conversation._id,
        message: savedMsg
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dm/faculty-list
 * @desc    Get list of faculty a student can DM
 * @access  Student
 */
const getFacultyList = async (req, res, next) => {
  try {
    const faculties = await Faculty.find({ isActive: true, isAdmin: false })
      .select('name facultyId department designation photo');

    res.json({ success: true, data: faculties });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dm/unread-count
 * @desc    Get total unread DM count for the current user
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';
    const filter = isStudent
      ? { student: req.student._id, studentUnread: { $gt: 0 } }
      : { faculty: req.faculty._id, facultyUnread: { $gt: 0 } };

    const conversations = await DirectMessage.find(filter).select(
      isStudent ? 'studentUnread' : 'facultyUnread'
    );

    const total = conversations.reduce((sum, c) => {
      return sum + (isStudent ? c.studentUnread : c.facultyUnread);
    }, 0);

    res.json({ success: true, unreadCount: total });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversations, getMessages, sendMessage, getFacultyList, getUnreadCount };
