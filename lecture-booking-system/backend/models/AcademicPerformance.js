const mongoose = require('mongoose');

const academicPerformanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String
  },
  internalMarks: {
    type: Number,
    default: 0
  },
  externalMarks: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  grade: {
    type: String
  },
  gradePoints: {
    type: Number,
    default: 0
  },
  // Overall GPA for the semester
  semesterGPA: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

academicPerformanceSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('AcademicPerformance', academicPerformanceSchema);
