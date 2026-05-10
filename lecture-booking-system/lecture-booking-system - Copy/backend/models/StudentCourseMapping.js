const mongoose = require('mongoose');

const studentCourseMappingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate enrollments
studentCourseMappingSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('StudentCourseMapping', studentCourseMappingSchema);
