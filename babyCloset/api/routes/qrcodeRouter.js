const authUtil = require('../../modules/utils/security/authUtils');
const express = require('express');
const router = express.Router();
const QrcodeController = require('../controllers/qrcodeController');
const upload = require('../../config/multer')

// router.get('/', authUtil.isLoggedIn, PostController.GetMainPost);
router.get('/:postIdx', authUtil.isLoggedIn, QrcodeController.getQrcode);
router.post('/', authUtil.isLoggedIn, QrcodeController.authenticateQrcode);

module.exports = router;