var express = require('express');
var router = express.Router();

router.use('/user', require('./userRouter'));
router.use('/post', require('./postRouter'));
router.use('/note', require('./noteRouter'));

module.exports = router;
