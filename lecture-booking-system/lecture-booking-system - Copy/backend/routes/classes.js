const express = require('express');
const router = express.Router();
const { authenticate, facultyOnly, studentOnly } = require('../middleware/auth');
const {
  getClasses, getClassById, createClass, updateClass, deleteClass,
  getFacultyClasses, getClassStudents, startClass, endClass
} = require('../controllers/classController');

router.get('/', authenticate, getClasses);
router.get('/faculty/my-classes', authenticate, facultyOnly, getFacultyClasses);
router.get('/:id', authenticate, getClassById);
router.get('/:id/students', authenticate, facultyOnly, getClassStudents);
router.post('/', authenticate, facultyOnly, createClass);
router.put('/:id', authenticate, facultyOnly, updateClass);
router.delete('/:id', authenticate, facultyOnly, deleteClass);
router.post('/:id/start', authenticate, facultyOnly, startClass);
router.post('/:id/end', authenticate, facultyOnly, endClass);

module.exports = router;
