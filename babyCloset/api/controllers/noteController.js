const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const noteAccessObject = require('../dataAccessObjects/noteAccessObject');
const db = require('../../modules/utils/db/pool');
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
            else if(getNotes.length == 0)
            {
                res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NO_X('유저')));
            }
            else {
                const filteredNotes = getNotes.map(note => {
                    note.createdTime = moment(note.createdTime).format('YY/MM/DD HH:mm');
                    if(note.senderIdx == loggedInUser)
                        note.noteType = 1
                    else
                        note.noteType = 0
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
    },
    GetNotesWithAllUsers : async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const getNotes = await noteAccessObject.GetNoteWithAllUsers(userIdx);
        if(!getNotes)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('쪽지')));
        else
        {
            console.log(userIdx)
            console.log('xx', getNotes)
            for(i=0; i<getNotes.length ;i++)
            {
                let counterpartIdx;
                if(getNotes[i].olderUserIdx == userIdx)
                    counterpartIdx = getNotes[i].youngerUserIdx;
                else
                    counterpartIdx = getNotes[i].olderUserIdx;
                console.log('??',counterpartIdx);
                const cnt = await noteAccessObject.GetUnreadNotesCount(counterpartIdx, userIdx);
                const getUserNickname = 'SELECT nickname FROM user WHERE userIdx = ?';
                const result = await db.queryParam_Arr(getUserNickname, [counterpartIdx]);
                if(!result)
                    res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('쪽지')));
                else
                {
                    getNotes[i].createdTime = moment(getNotes[i].createdTime).format('YYYY/MM/DD hh:mm');
                    getNotes[i].userIdx = counterpartIdx;
                    getNotes[i].nickname = result[0].nickname;
                    getNotes[i].unreadCount = cnt[0].cnt;
                    delete getNotes[i].olderUserIdx;
                    delete getNotes[i].youngerUserIdx;
                }
            }
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('쪽지'), {
                getNotes
            }));
        }
    }
}