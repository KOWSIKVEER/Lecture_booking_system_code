const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  // Status: booked, cancelled, attended, missed
  status: {
    type: String,
    enum: ['booked', 'cancelled', 'attended', 'missed'],
    default: 'booked',
    index: true
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Prevent duplicate bookings
bookingSchema.index({ student: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
