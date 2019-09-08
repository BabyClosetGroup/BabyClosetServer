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

    PostNoteWithUpdatingNoteManagement : async (noteContent, senderIdx, receiverIdx, createdTime) => {
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
        const updateNoteManagementQuery = `UPDATE noteManagement SET lastContent = ?, createdTime = ?
        WHERE olderUserIdx = ? AND youngerUserIdx = ?`;
        const insertTransaction = await db.Transaction(async(connection) => {
            await connection.query(insertNoteQuery, [noteContent, senderIdx, receiverIdx, createdTime]);
            await connection.query(updateNoteManagementQuery, [noteContent, createdTime, olderUserIdx, youngerUserIdx]);
        })
        return insertTransaction;
    },
    
    GetNotesWithSpecificUser : async (loggedInUser, counterpart) => {
        const getNotesQuery = `
        SELECT filteredNote.noteIdx, filteredNote.senderIdx, filteredNote.noteContent, filteredNote.createdTime, user.nickname
        FROM user,
        (SELECT noteIdx, noteContent, senderIdx, receiverIdx, createdTime
        FROM note
        WHERE (senderIdx = ? and receiverIdx= ?) OR (senderIdx = ? and receiverIdx = ?)
        ORDER BY createdTime DESC)
        AS filteredNote 
        WHERE user.userIdx = filteredNote.receiverIdx`;
        const getNotes = await db.queryParam_Arr(getNotesQuery, [loggedInUser, counterpart, counterpart, loggedInUser]);
        return getNotes;
    },
    UpdateReadBit : async(loggedInUser, counterpart) => {
        const updateIsRead = `UPDATE note SET isRead=1 WHERE isREAD <> 1 AND (senderIdx = ? AND receiverIdx= ?)`;
        const updateResult = await db.queryParam_Arr(updateIsRead, [counterpart, loggedInUser]);
        return updateResult;
    },
    GetCounterpartNickname : async(userIdx) => {
        const getCounterpartNickname = `SELECT userIdx, nickname FROM user where userIdx = ${userIdx}`;
        const getNickname = await db.queryParam_None(getCounterpartNickname);
        return getNickname;
    },
    GetNoteWithAllUsers : async(userIdx) => {
        const selectNotes = `SELECT olderUserIdx, youngerUserIdx, lastContent, createdTime FROM noteManagement
        WHERE olderUserIdx = ? OR youngerUserIdx = ?`;
        const selectNotesResult = await db.queryParam_Arr(selectNotes, [userIdx, userIdx]);
        return selectNotesResult;
    },
    GetUnreadNotesCount : async(senderIdx, receiverIdx) => {
        const getUnreadNotesCount = 'SELECT count(*) as cnt FROM note WHERE senderIdx=? AND receiverIdx = ? AND isRead = 0';
        const getCountResult = await db.queryParam_Arr(getUnreadNotesCount, [senderIdx, receiverIdx]);
        return getCountResult;
    },
    ConfirmNewMessage : async(userIdx) => {
        const confirmNewMessage = 'SELECT noteIdx FROM note WHERE receiverIdx = ? AND isRead = 0';
        const confirmNewMessageResult = await db.queryParam_Arr(confirmNewMessage, [userIdx]);
        return confirmNewMessageResult;
    }
}

