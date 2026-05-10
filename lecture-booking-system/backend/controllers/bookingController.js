const Booking = require('../models/Booking');
const Class = require('../models/Class');
const Notification = require('../models/Notification');

/**
 * @route   POST /api/bookings
 * @desc    Book a class
 * @access  Student
 */
const bookClass = async (req, res, next) => {
  try {
    const { classId } = req.body;
    const studentId = req.student._id;

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });
    if (cls.status !== 'scheduled') return res.status(400).json({ success: false, message: 'Class is not available for booking.' });
    if (cls.bookedCount >= cls.maxStudents) return res.status(400).json({ success: false, message: 'Class is fully booked.' });

    // Check existing booking
    const existing = await Booking.findOne({ student: studentId, class: classId });
    if (existing && existing.status === 'booked') {
      return res.status(400).json({ success: false, message: 'You have already booked this class.' });
    }

    if (existing && existing.status === 'cancelled') {
      // Re-book
      existing.status = 'booked';
      existing.bookedAt = new Date();
      existing.cancelledAt = null;
      await existing.save();
    } else {
      await Booking.create({ student: studentId, class: classId });
    }

    // Increment booked count
    await Class.findByIdAndUpdate(classId, { $inc: { bookedCount: 1 } });

    res.status(201).json({ success: true, message: 'Class booked successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel a booking
 * @access  Student
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.student.toString() !== req.student._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (booking.status !== 'booked') {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking.' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    await Class.findByIdAndUpdate(booking.class, { $inc: { bookedCount: -1 } });

    res.json({ success: true, message: 'Booking cancelled.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Get student's bookings
 * @access  Student
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { student: req.student._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'name courseId' },
          { path: 'faculty', select: 'name facultyId' }
        ]
      })
      .sort({ bookedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bookings/attended
 * @desc    Get previously attended classes
 * @access  Student
 */
const getAttendedClasses = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ student: req.student._id, status: 'attended' })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'name courseId' },
          { path: 'faculty', select: 'name facultyId' }
        ]
      })
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

module.exports = { bookClass, cancelBooking, getMyBookings, getAttendedClasses };
