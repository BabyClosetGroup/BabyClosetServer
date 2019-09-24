const db = require('../../modules/utils/db/pool');

module.exports = {
    PostShare :  async (postIdx, userIdx)  => {
        const postShareQuery = `INSERT INTO sharingWant (postIdx, applicantIdx) VALUES (?, ?)`;
        const updateCountQuery = 'UPDATE post SET registerNumber = registerNumber+1 where postIdx = ?'
        const postTransaction = await db.Transaction(async(connection) => {
            await connection.query(postShareQuery, [postIdx, userIdx]);
            await connection.query(updateCountQuery, [postIdx]);
        })
        return postTransaction;
    },
    GetUncompletedShare : async(userIdx) => {
        const selectPostQuery = 
        "SELECT postIdx, postTitle, mainImage, registerNumber FROM post WHERE isShared = 0 AND userIdx = ?";
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [userIdx]);
        return selectPostResult;
    },
    GetDetailUncompletedShare : async(postIdx) => {
        const selectPostQuery = 
        `SELECT postIdx, postTitle, mainImage, registerNumber AS applicantNumber FROM post WHERE postIdx = ?`;
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [postIdx]);
        return selectPostResult;
    },
    GetApplicantInformation : async(postIdx) => {
        const selectApplicantQuery = `
        SELECT a.applicantIdx AS applicantIdx, b.nickname AS applicantNickname, b.rating, b.profileImage FROM sharingWant
        AS a JOIN  user AS b WHERE a.postIdx = ? AND a.applicantIdx = b.userIdx`
        const selectApplicantResult = db.queryParam_Arr(selectApplicantQuery, [postIdx]);
        return selectApplicantResult;
    },
    GetCompletedShare : async(userIdx) => {
        const selectPostQuery = `
        SELECT b.postIdx, b.postTitle as postName, b.mainImage, b.receiverIdx, user.nickname AS receiverNickname, b.sharedDate, b.receiverIsRated, b.receiverRating FROM
        (SELECT a.postIdx, a.postTitle, a.mainImage, sharingSuccess.receiverIdx, sharingSuccess.sharedDate, sharingSuccess.receiverIsRated, sharingSuccess.receiverRating  FROM 
        (SELECT postIdx, postTitle, mainImage, registerNumber FROM post WHERE isShared = 1 AND userIdx = ?) AS a
        JOIN
        sharingSuccess where a.postIdx = sharingSuccess.postIdx) AS b
        JOIN user WHERE b.receiverIdx = user.userIdx`;
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [userIdx]);
        return selectPostResult;
    },
    GetReceivedShare : async(userIdx) => {
        const selectPostQuery = `
        SELECT c.postIdx, c.postTitle as postName, c.mainImage, c.userIdx AS senderIdx, user.nickname AS senderNickname, c.sharedDate, c.senderIsRated, c.senderRating
        FROM
        (SELECT a.postIdx, post.postTitle, post.mainImage, post.userIdx, a.sharedDate, a.senderIsRated, a.senderRating FROM
        (SELECT sharedDate, postIdx, senderIsRated, senderRating FROM BabyCloset.sharingSuccess where receiverIdx = ?) as a
        JOIN post where post.postIdx = a.postIdx) as c
        JOIN user
        WHERE user.userIdx = c.userIdx`;
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [userIdx]);
        return selectPostResult;
    }
}