const authUtil = require('../../modules/utils/security/authUtils');
const express = require('express');
const router = express.Router();
const QrcodeController = require('../controllers/qrcodeController');
const upload = require('../../config/multer')

// router.get('/', authUtil.isLoggedIn, PostController.GetMainPost);
router.post('/', authUtil.isLoggedIn, QrcodeController.makeQrcode);

module.exports = router;