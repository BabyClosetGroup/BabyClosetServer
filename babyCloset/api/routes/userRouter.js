const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const upload = require('../../config/multer');
const authUtil = require('../../modules/utils/security/authUtils');

router.get('/', authUtil.isLoggedIn, UserController.getUser);
router.post('/signup', UserController.SignUp);
router.post('/signin', UserController.SignIn);
router.put('/', upload.single('profileImage'), authUtil.isLoggedIn, UserController.UpdateProfile);

module.exports = router;