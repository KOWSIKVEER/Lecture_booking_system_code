const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  minStudents: {
    type: Number,
    default: 5
  },
  maxStudents: {
    type: Number,
    default: 60
  },
  bookedCount: {
    type: Number,
    default: 0
  },
  // Status: scheduled, ongoing, completed, cancelled
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  // Average rating from students
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  // Recurring class reference
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  meetingLink: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual for available seats
classSchema.virtual('availableSeats').get(function () {
  return this.maxStudents - this.bookedCount;
});

classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
