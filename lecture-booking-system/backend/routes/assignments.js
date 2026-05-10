const express = require('express');
const router = express.Router();
const { authenticate, studentOnly, facultyOnly, coordinatorOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAssignments, createAssignment, submitAssignment, gradeSubmission, getSubmissions
} = require('../controllers/assignmentController');

router.get('/', authenticate, getAssignments);
router.post('/', authenticate, coordinatorOnly, upload.array('attachments', 5), createAssignment);
router.post('/:id/submit', authenticate, studentOnly, upload.array('files', 5), submitAssignment);
router.post('/:id/grade/:submissionId', authenticate, facultyOnly, gradeSubmission);
router.get('/:id/submissions', authenticate, facultyOnly, getSubmissions);

module.exports = router;
