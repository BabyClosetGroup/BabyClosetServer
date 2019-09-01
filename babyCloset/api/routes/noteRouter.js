const express = require('express');
const router = express.Router();
const NoteController = require('../controllers/noteController');
const authUtil = require('../../modules/utils/security/authUtils');

router.get('/:userIdx', authUtil.isLoggedIn, NoteController.GetNotesWithSpecificUser);
router.post('/', authUtil.isLoggedIn, NoteController.PostNote);

module.exports = router;