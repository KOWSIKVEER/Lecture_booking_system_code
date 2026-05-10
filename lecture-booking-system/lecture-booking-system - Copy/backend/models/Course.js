const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  credits: {
    type: Number,
    default: 3
  },
  semester: {
    type: Number
  },
  // Faculty assigned as coordinator for this course
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
