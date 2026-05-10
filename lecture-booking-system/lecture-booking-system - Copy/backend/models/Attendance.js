const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  // present, absent, late
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'absent'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

attendanceSchema.index({ student: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
