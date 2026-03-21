const express = require('express');
const router  = express.Router();
const {
  getUsers, getUserById, updateMe,
  toggleFollow, getFollowers, getFollowing, getUserCollection, updateCover,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadAvatar, uploadCoverImage } = require('../config/cloudinary');

router.get('/',                   getUsers);

// ✅ IMPORTANT: /me and /me/cover MUST come before /:id
// otherwise Express matches "me" as an :id parameter
router.put('/me/cover',           protect, uploadCoverImage.single('coverImage'), updateCover);
router.put('/me',                 protect, uploadAvatar.single('avatar'), updateMe);

router.get('/:id',                optionalAuth, getUserById);
router.post('/:id/follow',        protect, toggleFollow);
router.get('/:id/followers',      getFollowers);
router.get('/:id/following',      getFollowing);
router.get('/:id/collection',     getUserCollection);

module.exports = router;
