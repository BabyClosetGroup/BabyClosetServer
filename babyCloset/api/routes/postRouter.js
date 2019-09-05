const authUtil = require('../../modules/utils/security/authUtils');
const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController');
const upload = require('../../config/multer')

router.get('/main', authUtil.isLoggedIn, PostController.GetMainPost);
router.get('/all/:pagination', authUtil.isLoggedIn, PostController.GetAllPost);
router.get('/deadline/:pagination', authUtil.isLoggedIn, PostController.GetDeadlinePost);
router.get('/qrcode', authUtil.isLoggedIn, PostController.SelectPostForQRCode);
router.get('/:postIdx', authUtil.isLoggedIn, PostController.GetPostDetail);
router.post('/filter/all/:pagination', authUtil.isLoggedIn, PostController.GetFilteredAllPost);
router.post('/filter/deadline/:pagination', authUtil.isLoggedIn, PostController.GetFilteredDeadlinePost);
router.post('/', upload.array('postImages'), authUtil.isLoggedIn, PostController.RegisterPost);
router.put('/:postIdx', upload.array('postImages'), authUtil.isLoggedIn, PostController.UpdatePost);
router.delete('/:postIdx', authUtil.isLoggedIn, PostController.DeletePost);

module.exports = router;