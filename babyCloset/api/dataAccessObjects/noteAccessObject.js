const db = require('../../modules/utils/db/pool');

module.exports = {
    PostNote : async (noteContent, senderIdx, receiverIdx, createdTime) => {
        const insertNoteQuery = 'INSERT INTO note (noteContent, senderIdx, receiverIdx, createdTime) VALUES (?, ?, ?, ?)';
        const insertNoteResult = await db.queryParam_Arr(insertNoteQuery, [noteContent, senderIdx, receiverIdx, createdTime]);
        return insertNoteResult;
    },
    GetNotesWithSpecificUser : async (userIdx1, userIdx2) => {
        const getNotesQuery = `SELECT noteIdx, noteContent, senderIdx, receiverIdx
        FROM note WHERE (senderIdx = ${userIdx1} AND receiverIdx=${userIdx2})
        OR (senderIdx = ${userIdx2} AND receiverIdx= ${userIdx1}) ORDER BY createdTime DESC`;
        const updateIsRead = `UPDATE note SET isRead=1 WHERE isREAD <> 1 AND (senderIdx = ${userIdx1} AND receiverIdx=${userIdx2})
        OR (senderIdx = ${userIdx2} AND receiverIdx= ${userIdx1})`;
        const getTransaction = await db.Transaction(async(connection) => {
            await connection.query(getNotesQuery);
            await connection.query(updateIsRead);
            });
        return getTransaction;
    }
}