var express = require('express');
var router = express.Router();

router.use('/user', require('./userRouter'));
router.use('/post', require('./postRouter'));
router.use('/note', require('./noteRouter'));
router.use('/complain', require('./complainRouter'));
router.use('/share', require('./shareRouter'));
router.use('/rating', require('./ratingRouter'));

module.exports = router;
