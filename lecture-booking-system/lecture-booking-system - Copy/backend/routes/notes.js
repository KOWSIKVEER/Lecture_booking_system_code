const express = require('express');
const router = express.Router();
const { authenticate, facultyOnly, studentOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getNotes, uploadNote, summarizeNote, downloadNote, deleteNote } = require('../controllers/noteController');

router.get('/', authenticate, getNotes);
router.post('/', authenticate, facultyOnly, upload.array('files', 10), uploadNote);
router.post('/:id/summarize', authenticate, summarizeNote);
router.get('/:id/download', authenticate, downloadNote);
router.delete('/:id', authenticate, facultyOnly, deleteNote);

module.exports = router;
