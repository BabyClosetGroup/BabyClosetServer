const db = require('../../modules/utils/db/pool');

module.exports = {
    CheckNoteManagement : async(senderIdx, receiverIdx) => {
        const checkNoteManagementQuery = 'SELECT noteManagementIdx FROM noteManagement where olderUserIdx = ? AND youngerUserIdx = ?';
        let checkNoteManagementResult;
        if(senderIdx > receiverIdx)
        {
           checkNoteManagementResult = await db.queryParam_Arr(checkNoteManagementQuery, [receiverIdx, senderIdx]);
        }
        else
        {
            checkNoteManagementResult = await db.queryParam_Arr(checkNoteManagementQuery, [senderIdx, receiverIdx]);
        }
        return checkNoteManagementResult;
    },
    PostNoteWithNewNoteManagement : async (noteContent, senderIdx, receiverIdx, createdTime) => {
        let olderUserIdx;
        let youngerUserIdx;
        if(senderIdx > receiverIdx)
        {
            olderUserIdx = receiverIdx;
            youngerUserIdx = senderIdx;
        }
        else
        {
            olderUserIdx = senderIdx;
            youngerUserIdx = receiverIdx;
        }
        const insertNoteQuery = 'INSERT INTO note (noteContent, senderIdx, receiverIdx, createdTime) VALUES (?, ?, ?, ?)';
        const insertNoteManagementQuery = `INSERT INTO noteManagement (olderUserIdx, youngerUserIdx, lastContent, createdTime)
        VALUES (?, ?, ?, ?)`;
        const insertTransaction = await db.Transaction(async(connection) => {
            await connection.query(insertNoteQuery, [noteContent, senderIdx, receiverIdx, createdTime]);
            await connection.query(insertNoteManagementQuery, [olderUserIdx, youngerUserIdx, noteContent, createdTime]);
        })
        return insertTransaction;
    },
    
    GetNotesWithSpecificUser : async (userIdx1, userIdx2) => {
        const getNotesQuery = `
        SELECT filteredNote.noteIdx, filteredNote.senderIdx, filteredNote.noteContent, filteredNote.createdTime, user.nickname
        FROM user,
        (SELECT noteIdx, noteContent, senderIdx, receiverIdx, createdTime
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

