const db = require('../../modules/utils/db/pool');

module.exports = {
    PostNote : async (noteContent, senderIdx, receiverIdx, createdTime) => {
        const insertNoteQuery = 'INSERT INTO note (noteContent, senderIdx, receiverIdx, createdTime) VALUES (?, ?, ?, ?)';
        const insertNoteResult = await db.queryParam_Arr(insertNoteQuery, [noteContent, senderIdx, receiverIdx, createdTime]);
        return insertNoteResult;
    },
    GetNotesWithSpecificUser : async (userIdx1, userIdx2) => {
        const getNotesQuery = `SELECT noteIdx, noteContent, senderIdx, receiverIdx
        FROM BabyCloset.note where (senderIdx = ${userIdx1} and receiverIdx=${userIdx2})
        OR (senderIdx = ${userIdx2} and receiverIdx= ${userIdx1}) order by createdTime desc`
        const getNotesResult = await db.queryParam_None(getNotesQuery);
        return getNotesResult
    }
}