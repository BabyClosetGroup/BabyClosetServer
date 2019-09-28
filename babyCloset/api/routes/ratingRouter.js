const authUtil = require('../../modules/utils/security/authUtils');
const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');

router.get('/:userIdx', authUtil.isLoggedIn, RatingController.GetRating);
router.get('/IOS/:userIdx', authUtil.isLoggedIn, RatingController.GetRatingIOS);
router.post('/', authUtil.isLoggedIn, RatingController.PostRating);

module.exports = router;