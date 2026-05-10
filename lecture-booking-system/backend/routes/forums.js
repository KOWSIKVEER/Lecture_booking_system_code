const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getForums, createForum, getForumById, replyToForum, likeForum, deleteForum } = require('../controllers/forumController');

router.get('/', authenticate, getForums);
router.post('/', authenticate, createForum);
router.get('/:id', authenticate, getForumById);
router.post('/:id/reply', authenticate, replyToForum);
router.post('/:id/like', authenticate, likeForum);
router.delete('/:id', authenticate, deleteForum);

module.exports = router;
