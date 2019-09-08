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
            const checkNoteManagement = await noteAccessObject.CheckNoteManagement(senderIdx, receiverIdx);
            if(!checkNoteManagement)
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('쪽지')));
            else
            {
                if(checkNoteManagement.length==0)
                {
                    const insertNote = await noteAccessObject.PostNoteWithNewNoteManagement(noteContent, senderIdx, receiverIdx, createdTime)
                    if (!insertNote) {
                    res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('쪽지')));
                    } else {
                    res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('쪽지')));
                    }
                }
                else
                {
                    const insertNote = await noteAccessObject.PostNoteWithUpdatingNoteManagement(noteContent, senderIdx, receiverIdx, createdTime)
                    if (!insertNote) {
                    res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('쪽지')));
                    } else {
                    res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('쪽지')));
                    }
                }
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
            const updateReadBit = await noteAccessObject.UpdateReadBit(loggedInUser, counterpart);
            const getCounterpartNickname = await noteAccessObject.GetCounterpartNickname(counterpart);
            console.log(getNotes);
            if (!getNotes || !updateReadBit || !getCounterpartNickname) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('쪽지')));
            }
            else {
                const filteredNotes = getNotes.map(note => {
                    note.createdTime = moment(note.createdTime).format('YY/MM/DD HH:mm');
                    if(note.senderIdx == loggedInUser)
                        note.noteType = "보낸 쪽지"
                    else
                        note.noteType = "받은 쪽지"
                    delete note.senderIdx;
                    delete note.nickname;
                    return note;
                })
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('쪽지'), {
                    receiver: getCounterpartNickname[0],
                    messages : filteredNotes
                }));
            }
        }
    }
}