const express = require('express');
const router = express.Router();
const ShareController = require('../controllers/shareController');
const authUtil = require('../../modules/utils/security/authUtils');

router.post('/', authUtil.isLoggedIn, ShareController.PostShare);

module.exports = router;