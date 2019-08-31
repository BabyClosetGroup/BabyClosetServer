const authUtil = require('../../modules/utils/security/authUtils');
const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController');
const upload = require('../../config/multer')

router.get('/main', PostController.GetMainPost);
router.get('/all/:pagination', PostController.GetAllPost);
router.get('/deadline/:pagination', PostController.GetDeadlinePost);
router.get('/:postIdx', PostController.GetPostDetail);
router.post('/filter', PostController.GetFilteredPost);
router.post('/', upload.array('postImages'), authUtil.isLoggedIn, PostController.RegisterPost);

module.exports = router;