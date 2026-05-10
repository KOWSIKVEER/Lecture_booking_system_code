const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    required: true
  },
  startTime: {
    type: String, // "HH:MM" format
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  semester: {
    type: Number
  },
  academicYear: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timetable', timetableSchema);
