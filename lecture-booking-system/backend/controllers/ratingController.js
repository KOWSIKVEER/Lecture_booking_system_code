const Rating = require('../models/Rating');
const Class = require('../models/Class');

/**
 * @route   POST /api/ratings
 * @desc    Rate a class
 * @access  Student
 */
const rateClass = async (req, res, next) => {
  try {
    const { classId, rating, review } = req.body;

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });
    if (cls.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only rate completed classes.' });

    const existing = await Rating.findOne({ class: classId, student: req.student._id });
    if (existing) {
      existing.rating = rating;
      existing.review = review;
      await existing.save();
    } else {
      await Rating.create({ class: classId, student: req.student._id, rating, review });
    }

    // Recalculate average rating
    const stats = await Rating.aggregate([
      { $match: { class: cls._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Class.findByIdAndUpdate(classId, {
        averageRating: Math.round(stats[0].avg * 10) / 10,
        ratingCount: stats[0].count
      });
    }

    res.json({ success: true, message: 'Rating submitted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ratings/class/:classId
 * @desc    Get ratings for a class
 * @access  Private
 */
const getClassRatings = async (req, res, next) => {
  try {
    const ratings = await Rating.find({ class: req.params.classId })
      .populate('student', 'name rollNumber');

    res.json({ success: true, data: ratings });
  } catch (error) {
    next(error);
  }
};

module.exports = { rateClass, getClassRatings };
