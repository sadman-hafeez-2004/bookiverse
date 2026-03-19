const User       = require('../models/User');
const Follow     = require('../models/Follow');
const Collection = require('../models/Collection');

// GET /api/users  — browse all users (search by username)
const getUsers = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const query = search
      ? { username: { $regex: search, $options: 'i' } }
      : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    res.json({ users, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id  — public profile
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // If a logged-in user is viewing, tell them if they follow this person
    let isFollowing = false;
    if (req.user) {
      isFollowing = !!(await Follow.findOne({
        follower: req.user._id,
        following: user._id,
      }));
    }

    res.json({ user, isFollowing });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/me  — update own profile
const updateMe = async (req, res, next) => {
  try {
    const { username, bio } = req.body;
    const update = {};
    if (username) update.username = username;
    if (bio !== undefined) update.bio = bio;

    // If avatar file uploaded via multer-cloudinary
    if (req.file) update.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:id/follow  — follow or unfollow
const toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const existing = await Follow.findOne({
      follower: req.user._id,
      following: targetId,
    });

    if (existing) {
      // Unfollow
      await existing.deleteOne();
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetId,      { $inc: { followersCount: -1 } });
      return res.json({ following: false, message: 'Unfollowed.' });
    }

    // Follow
    await Follow.create({ follower: req.user._id, following: targetId });
    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(targetId,      { $inc: { followersCount: 1 } });
    res.json({ following: true, message: 'Followed.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/followers
const getFollowers = async (req, res, next) => {
  try {
    const follows = await Follow.find({ following: req.params.id })
      .populate('follower', 'username avatar followersCount')
      .sort({ createdAt: -1 });
    res.json({ followers: follows.map(f => f.follower) });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/following
const getFollowing = async (req, res, next) => {
  try {
    const follows = await Follow.find({ follower: req.params.id })
      .populate('following', 'username avatar followersCount')
      .sort({ createdAt: -1 });
    res.json({ following: follows.map(f => f.following) });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/collection  — user's collected books
const getUserCollection = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const collections = await Collection.find({ user: req.params.id })
      .populate({
        path: 'book',
        populate: { path: 'author', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Collection.countDocuments({ user: req.params.id });
    res.json({ collections, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateMe,
  toggleFollow,
  getFollowers,
  getFollowing,
  getUserCollection,
};
