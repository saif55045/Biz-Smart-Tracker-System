const express = require('express');
const router = express.Router();
const discussionController = require('../controller/discussionController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes (with authentication but no specific role required)
router.get('/', authMiddleware, discussionController.getDiscussions);
router.get('/stats', authMiddleware, discussionController.getDiscussionStats);
router.get('/categories', authMiddleware, discussionController.getCategories);
router.get('/:id', authMiddleware, discussionController.getDiscussionById);

// Protected routes (only for admins/shop owners)
router.post('/', authMiddleware, discussionController.createDiscussion);
router.put('/:id', authMiddleware, discussionController.updateDiscussion);
router.delete('/:id', authMiddleware, discussionController.deleteDiscussion);

// Reply routes
router.post('/:id/replies', authMiddleware, discussionController.addReply);

// Like routes
router.post('/:id/like', authMiddleware, discussionController.toggleLikeDiscussion);
router.post('/:discussionId/replies/:replyId/like', authMiddleware, discussionController.toggleLikeReply);

module.exports = router;