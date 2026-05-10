const express = require('express');
const router = express.Router();
const { authenticate, studentOnly } = require('../middleware/auth');
const { rateClass, getClassRatings } = require('../controllers/ratingController');

router.post('/', authenticate, studentOnly, rateClass);
router.get('/class/:classId', authenticate, getClassRatings);

module.exports = router;
