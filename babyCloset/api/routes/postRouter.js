const authUtil = require('../../modules/utils/security/authUtils');
const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController');
const upload = require('../../config/multer')

router.get('/main', PostController.mainPost);
router.get('/all/:pagination', PostController.allPost);
router.get('/deadline/:pagination', PostController.deadlinePost);
router.post('/', upload.array('postImages'), authUtil.isLoggedIn, PostController.RegisterPost);

module.exports = router;