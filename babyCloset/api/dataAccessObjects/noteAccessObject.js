const db = require('../../modules/utils/db/pool');

module.exports = {
    PostNote : async (noteContent, senderIdx, receiverIdx, createdTime) => {
        const insertNoteQuery = 'INSERT INTO note (noteContent, senderIdx, receiverIdx, createdTime) VALUES (?, ?, ?, ?)';
        const insertNoteResult = await db.queryParam_Arr(insertNoteQuery, [noteContent, senderIdx, receiverIdx, createdTime]);
        return insertNoteResult;
    },
    GetNotesWithSpecificUser : async (userIdx1, userIdx2) => {
        const getNotesQuery = `
        SELECT filteredNote.noteIdx, filteredNote.noteContent, filteredNote.senderIdx, filteredNote.receiverIdx, user.nickname
        FROM user,
        (SELECT noteIdx, noteContent, senderIdx, receiverIdx
        FROM note
        WHERE (senderIdx = ${userIdx1} and receiverIdx=${userIdx2}) OR (senderIdx = ${userIdx2} and receiverIdx = ${userIdx1})
        ORDER BY createdTime DESC)
        AS filteredNote 
        WHERE user.userIdx = filteredNote.receiverIdx`;
        const getNotes = await db.queryParam_None(getNotesQuery);
        return getNotes;
    },
    UpdateReadBit : async(userIdx1, userIdx2) => {
        const updateIsRead = `UPDATE note SET isRead=1 WHERE isREAD <> 1 AND (senderIdx = ${userIdx1} AND receiverIdx=${userIdx2})
        OR (senderIdx = ${userIdx2} AND receiverIdx= ${userIdx1})`;
        const updateResult = await db.queryParam_None(updateIsRead);
        return updateResult;
    },
    GetCounterpartNickname : async(userIdx) => {
        const getCounterpartNickname = `SELECT userIdx, nickname FROM user where userIdx = ${userIdx}`;
        const getNickname = await db.queryParam_None(getCounterpartNickname);
        return getNickname;
    }
}

