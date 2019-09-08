const express = require('express');
const router = express.Router();
const ComplainController = require('../controllers/complainController');
const authUtil = require('../../modules/utils/security/authUtils');

router.post('/', authUtil.isLoggedIn, ComplainController.PostComplain);

module.exports = router;