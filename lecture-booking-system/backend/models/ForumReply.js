const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  authorType: {
    type: String,
    enum: ['Student', 'Faculty'],
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorType'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  // Parent reply for nested replies
  parentReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumReply',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ForumReply', forumReplySchema);
