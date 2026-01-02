const Discussion = require('../models/Discussion');
const User = require('../models/User');

// Get all discussions with filters
exports.getDiscussions = async (req, res) => {
  try {
    const { category, search, sort = 'recent', page = 1, limit = 10, tags, timeRange } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Base query
    let query = {};

    // If category is provided, filter by it
    if (category && category !== 'All') {
      query.category = category;
    }

    // If search term is provided, use text search
    if (search) {
      query.$text = { $search: search };
    }

    // If tags are provided (comma-separated), filter by them
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      if (tagArray.length > 0) {
        query.tags = { $in: tagArray };
      }
    }

    // If timeRange is provided, filter by createdAt date
    if (timeRange) {
      const now = new Date();
      let dateFilter;

      switch (timeRange) {
        case 'day':
          dateFilter = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          // Don't add date filter for 'all' or invalid values
          break;
      }

      if (dateFilter) {
        query.createdAt = { $gte: dateFilter };
      }
    }

    // Sort options
    const sortOptions = {
      recent: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { likes: -1 },
      mostLiked: { 'likes.length': -1 },
      mostReplies: { 'replies.length': -1 },
      mostViewed: { views: -1 }
    };

    // Execute query with pagination
    const discussions = await Discussion.find(query)
      .sort(sortOptions[sort] || { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username company_name')
      .lean();

    // Get total count for pagination
    const total = await Discussion.countDocuments(query);

    res.status(200).json({
      discussions,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a single discussion by ID
exports.getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the discussion and populate author details
    const discussion = await Discussion.findById(id)
      .populate('author', 'username company_name')
      .populate('replies.user', 'username company_name')
      .lean();

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Increment view count
    await Discussion.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.status(200).json(discussion);
  } catch (error) {
    console.error('Error fetching discussion:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const author = req.user.id; // From auth middleware

    // Create the new discussion
    const discussion = new Discussion({
      title,
      content,
      category,
      author,
      tags: tags || []
    });

    await discussion.save();

    // Populate author details for the response
    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('author', 'username company_name')
      .lean();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('new_discussion', populatedDiscussion);
    }

    res.status(201).json(populatedDiscussion);
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a discussion
exports.updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;
    const userId = req.user.id; // From auth middleware

    // Find the discussion
    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check if user is the author
    if (discussion.author.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own discussions' });
    }

    // Update the discussion
    discussion.title = title || discussion.title;
    discussion.content = content || discussion.content;
    discussion.category = category || discussion.category;
    discussion.tags = tags || discussion.tags;
    discussion.updatedAt = Date.now();

    await discussion.save();

    // Populate author details for the response
    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('author', 'username company_name')
      .populate('replies.user', 'username company_name')
      .lean();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`discussion_${id}`).emit('update_discussion', populatedDiscussion);
    }

    res.status(200).json(populatedDiscussion);
  } catch (error) {
    console.error('Error updating discussion:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a discussion
exports.deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    // Find the discussion
    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check if user is the author
    if (discussion.author.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own discussions' });
    }

    // Delete the discussion
    await Discussion.findByIdAndDelete(id);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('delete_discussion', { id });
    }

    res.status(200).json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a reply to a discussion
exports.addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // From auth middleware

    // Find the discussion
    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Add the reply
    const newReply = {
      user: userId,
      content
    };

    discussion.replies.push(newReply);
    discussion.updatedAt = Date.now();

    await discussion.save();

    // Get the newly added reply
    const addedReply = discussion.replies[discussion.replies.length - 1];

    // Populate author details for the response
    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('author', 'username company_name')
      .populate('replies.user', 'username company_name')
      .lean();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`discussion_${id}`).emit('new_reply', {
        discussionId: id,
        reply: populatedDiscussion.replies[populatedDiscussion.replies.length - 1],
        updatedAt: populatedDiscussion.updatedAt
      });
    }

    res.status(200).json(populatedDiscussion);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle like on a discussion
exports.toggleLikeDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    // Find the discussion
    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check if the user already liked the discussion
    const likeIndex = discussion.likes.findIndex(
      like => like.toString() === userId
    );

    if (likeIndex === -1) {
      // Add like
      discussion.likes.push(userId);
    } else {
      // Remove like
      discussion.likes.splice(likeIndex, 1);
    }

    await discussion.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`discussion_${id}`).emit('update_likes', {
        discussionId: id,
        likes: discussion.likes,
        action: likeIndex === -1 ? 'added' : 'removed'
      });
    }

    res.status(200).json({
      message: likeIndex === -1 ? 'Discussion liked' : 'Like removed',
      likes: discussion.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle like on a reply
exports.toggleLikeReply = async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;
    const userId = req.user.id; // From auth middleware

    // Find the discussion
    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Find the reply
    const reply = discussion.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Check if the user already liked the reply
    const likeIndex = reply.likes.findIndex(
      like => like.toString() === userId
    );

    if (likeIndex === -1) {
      // Add like
      reply.likes.push(userId);
    } else {
      // Remove like
      reply.likes.splice(likeIndex, 1);
    }

    await discussion.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`discussion_${discussionId}`).emit('update_reply_likes', {
        discussionId,
        replyId,
        likes: reply.likes,
        action: likeIndex === -1 ? 'added' : 'removed'
      });
    }

    res.status(200).json({
      message: likeIndex === -1 ? 'Reply liked' : 'Like removed',
      likes: reply.likes.length
    });
  } catch (error) {
    console.error('Error toggling like on reply:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get discussion statistics
exports.getDiscussionStats = async (req, res) => {
  try {
    // Get total count of discussions
    const totalDiscussions = await Discussion.countDocuments();

    // Calculate total replies across all discussions
    const repliesResult = await Discussion.aggregate([
      { $project: { replyCount: { $size: { $ifNull: ["$replies", []] } } } },
      { $group: { _id: null, totalReplies: { $sum: "$replyCount" } } }
    ]);

    const totalReplies = repliesResult.length > 0 ? repliesResult[0].totalReplies : 0;

    // Get count of unique authors (active shop owners)
    const activeUsersResult = await Discussion.aggregate([
      { $group: { _id: "$author" } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    const activeUsers = activeUsersResult.length > 0 ? activeUsersResult[0].count : 0;

    // Get category distribution
    const categoryStats = await Discussion.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get most active users
    const activeUsersDetails = await Discussion.aggregate([
      { $group: { _id: "$author", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Populate user details for most active users
    const populatedUsers = await User.populate(activeUsersDetails, {
      path: "_id",
      select: "username company_name"
    });

    // Format result
    const mostActiveUsers = populatedUsers.map(user => ({
      user: user._id,
      discussionCount: user.count
    }));

    // Get most viewed and most liked discussions
    const mostViewed = await Discussion.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title views')
      .lean();

    const mostLiked = await Discussion.find()
      .sort({ likes: -1 })
      .limit(5)
      .select('title likes')
      .lean();

    res.status(200).json({
      totalDiscussions,
      totalReplies,
      activeUsers,
      categoryStats,
      mostActiveUsers,
      mostViewed,
      mostLiked
    });
  } catch (error) {
    console.error('Error getting discussion stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get available discussion categories
exports.getCategories = async (req, res) => {
  try {
    // Get unique categories from discussions
    const categories = await Discussion.distinct('category');

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching discussion categories:', error);
    res.status(500).json({ error: error.message });
  }
};