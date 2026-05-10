const Timetable = require('../models/Timetable');
const Class = require('../models/Class');

/**
 * @route   GET /api/timetable/my-timetable
 * @desc    Get faculty timetable
 * @access  Faculty
 */
const getMyTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.find({ faculty: req.faculty._id, isActive: true })
      .populate('course', 'name courseId department')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ success: true, data: timetable });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/timetable/faculty/:facultyId
 * @desc    Get timetable for a specific faculty (Admin)
 * @access  Admin
 */
const getFacultyTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.find({ faculty: req.params.facultyId, isActive: true })
      .populate('course', 'name courseId')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ success: true, data: timetable });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/timetable
 * @desc    Create timetable entry (Admin)
 * @access  Admin
 */
const createTimetableEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.create(req.body);
    const populated = await Timetable.findById(entry._id)
      .populate('course', 'name courseId')
      .populate('faculty', 'name facultyId');

    res.status(201).json({ success: true, message: 'Timetable entry created.', data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/timetable/:id
 * @desc    Update timetable entry (Admin)
 * @access  Admin
 */
const updateTimetableEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('course', 'name courseId')
      .populate('faculty', 'name facultyId');

    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

    res.json({ success: true, message: 'Timetable updated.', data: entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/timetable/:id
 * @desc    Delete timetable entry (Admin)
 * @access  Admin
 */
const deleteTimetableEntry = async (req, res, next) => {
  try {
    await Timetable.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Timetable entry deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/timetable/schedule-class
 * @desc    Schedule next recurring class from timetable
 * @access  Faculty
 */
const scheduleNextClass = async (req, res, next) => {
  try {
    const { timetableId, topic, description, minStudents, maxStudents, date, time, location } = req.body;

    const timetableEntry = await Timetable.findById(timetableId).populate('course');
    if (!timetableEntry) return res.status(404).json({ success: false, message: 'Timetable entry not found.' });

    // Build start/end time from provided date and timetable times
    const startDateTime = new Date(`${date}T${time || timetableEntry.startTime}:00`);
    const [endH, endM] = timetableEntry.endTime.split(':');
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(parseInt(endH), parseInt(endM));

    const newClass = await Class.create({
      course: timetableEntry.course._id,
      faculty: req.faculty._id,
      topic: topic || `${timetableEntry.course.name} - Regular Class`,
      description,
      startTime: startDateTime,
      endTime: endDateTime,
      location: location || timetableEntry.location,
      minStudents: minStudents || 5,
      maxStudents: maxStudents || 60,
      isRecurring: true
    });

    res.status(201).json({ success: true, message: 'Class scheduled.', data: newClass });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyTimetable, getFacultyTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, scheduleNextClass };
