const db = require('../../modules/utils/db/pool');

module.exports = {
    PostNote : async (noteContent, senderIdx, receiverIdx, createdTime) => {
        const insertNoteQuery = 'INSERT INTO note (noteContent, senderIdx, receiverIdx, createdTime) VALUES (?, ?, ?, ?)';
        const insertNoteResult = await db.queryParam_Arr(insertNoteQuery, [noteContent, senderIdx, receiverIdx, createdTime]);
        return insertNoteResult;
    }
}