const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const noteAccessObject = require('../dataAccessObjects/noteAccessObject');
const moment = require('moment');

module.exports = {
    PostNote : async(req, res) => {
        const noteContent = req.body.noteContent;
        const senderIdx = req.decoded.userIdx;
        const receiverIdx = req.body.receiverIdx;
        const createdTime = moment().format('YYYY-MM-DD hh:mm:ss');
        if(!receiverIdx || !senderIdx || !noteContent)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            const insertNote = await noteAccessObject.PostNote(noteContent, senderIdx, receiverIdx, createdTime)
            if (!insertNote) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('쪽지')));
            } else {
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('쪽지')));
            }
        }
    },
    GetNotesWithSpecificUser : async(req, res) => {
        const loggedInUser = req.decoded.userIdx;
        const counterpart = req.params.userIdx;
        if(!counterpart)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            const getNotes = await noteAccessObject.GetNotesWithSpecificUser(loggedInUser, counterpart);
            if (!getNotes) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('쪽지')));
            } else {
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('쪽지')));
            }
        }
    }
}