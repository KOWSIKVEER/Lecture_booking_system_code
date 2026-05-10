const mongoose = require('mongoose');

/**
 * A conversation thread between one student and one faculty.
 * Messages are embedded for simplicity and real-time access.
 */
const messageSchema = new mongoose.Schema({
  senderType: {
    type: String,
    enum: ['Student', 'Faculty'],
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'messages.senderType'
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

const directMessageSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
    index: true
  },
  // Last message preview for inbox listing
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  // Unread counts per side
  studentUnread: {
    type: Number,
    default: 0
  },
  facultyUnread: {
    type: Number,
    default: 0
  },
  messages: [messageSchema]
}, {
  timestamps: true
});

// One conversation per student-faculty pair
directMessageSchema.index({ student: 1, faculty: 1 }, { unique: true });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
