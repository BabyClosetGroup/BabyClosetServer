const express = require('express');
const router = express.Router();
const ShareController = require('../controllers/shareController');
const authUtil = require('../../modules/utils/security/authUtils');

router.get('/uncompleted', authUtil.isLoggedIn, ShareController.GetUncompleted);
router.get('/completed', authUtil.isLoggedIn, ShareController.GetCompleted);
router.get('/received', authUtil.isLoggedIn, ShareController.GetReceived);
router.get('/:postIdx', authUtil.isLoggedIn, ShareController.GetApplicant);
router.post('/', authUtil.isLoggedIn, ShareController.PostShare);

module.exports = router;