const express = require('express');
const router = express.Router();
const { authenticate, studentOnly } = require('../middleware/auth');
const { bookClass, cancelBooking, getMyBookings, getAttendedClasses } = require('../controllers/bookingController');

router.get('/my-bookings', authenticate, studentOnly, getMyBookings);
router.get('/attended', authenticate, studentOnly, getAttendedClasses);
router.post('/', authenticate, studentOnly, bookClass);
router.delete('/:id', authenticate, studentOnly, cancelBooking);

module.exports = router;
