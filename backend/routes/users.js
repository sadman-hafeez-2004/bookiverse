const express = require('express');
const router  = express.Router();
const {
  getUsers, getUserById, updateMe,
  toggleFollow, getFollowers, getFollowing, getUserCollection, updateCover,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadAvatar, uploadCoverImage } = require('../config/cloudinary');

router.get('/',                   getUsers);
router.get('/:id',                optionalAuth, getUserById);
router.put('/me',                 protect, uploadAvatar.single('avatar'), updateMe);
router.put('/me/cover',           protect, uploadCoverImage.single('coverImage'), updateCover);
router.post('/:id/follow',        protect, toggleFollow);
router.get('/:id/followers',      getFollowers);
router.get('/:id/following',      getFollowing);
router.get('/:id/collection',     getUserCollection);

module.exports = router;
