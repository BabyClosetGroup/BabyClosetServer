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
        `SELECT selectedPost.postIdx, selectedPost.postTitle, selectedPost.mainImage, area.areaName, selectedPost.registerNumber FROM
        (SELECT postIdx, postTitle, mainImage, registerNumber FROM post WHERE isShared = 0 AND userIdx = ?) AS selectedPost,
        (SELECT postAreaCategory.postIdx, areaCategory.areaName
        FROM areaCategory, postAreaCategory WHERE areaCategory.areaCategoryIdx = postAreaCategory.areaCategoryIdx) AS area
        WHERE selectedPost.postIdx = area.postIdx`;
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [userIdx]);
        return selectPostResult;
    },
    GetDetailUncompletedShare : async(postIdx) => {
        const selectPostQuery = 
        `SELECT selectedPost.postIdx, selectedPost.postTitle, selectedPost.mainImage, area.areaName, selectedPost.registerNumber AS applicantNumber FROM
        (SELECT postIdx, postTitle, mainImage, registerNumber FROM post WHERE postIdx = ? AND isShared = 0)  AS selectedPost,
        (SELECT postAreaCategory.postIdx, areaCategory.areaName
        FROM areaCategory, postAreaCategory WHERE areaCategory.areaCategoryIdx = postAreaCategory.areaCategoryIdx) AS area
        WHERE selectedPost.postIdx = area.postIdx`;
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [postIdx]);
        return selectPostResult;
    },
    GetApplicantInformation : async(postIdx) => {
        const selectApplicantQuery = `
        SELECT a.applicantIdx AS applicantIdx, b.nickname AS applicantNickname, b.rating FROM sharingWant
        AS a JOIN  user AS b WHERE a.postIdx = ? AND a.applicantIdx = b.userIdx`
        const selectApplicantResult = db.queryParam_Arr(selectApplicantQuery, [postIdx]);
        return selectApplicantResult;
    },
    GetCompletedShare : async(userIdx) => {
        const selectPostQuery = `
        SELECT b.postIdx, b.postTitle as postName, b.mainImage, b.areaName, b.receiverIdx, user.nickname AS receiverNickname, b.sharedDate, b.receiverIsRated FROM
        (SELECT a.postIdx, a.postTitle, a.mainImage, a.areaName, sharingSuccess.receiverIdx, sharingSuccess.sharedDate, sharingSuccess.receiverIsRated  FROM 
        (SELECT selectedPost.postIdx, selectedPost.postTitle, selectedPost.mainImage, area.areaName, selectedPost.registerNumber FROM
        (SELECT postIdx, postTitle, mainImage, registerNumber FROM post WHERE isShared = 1 AND userIdx = ?) AS selectedPost,
        (SELECT postAreaCategory.postIdx, areaCategory.areaName
        FROM areaCategory, postAreaCategory WHERE areaCategory.areaCategoryIdx = postAreaCategory.areaCategoryIdx) AS area
        WHERE selectedPost.postIdx = area.postIdx) AS a
        JOIN
        sharingSuccess where a.postIdx = sharingSuccess.postIdx) AS b
        JOIN user WHERE b.receiverIdx = user.userIdx`;
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [userIdx]);
        return selectPostResult;
    },
    GetReceivedShare : async(userIdx) => {
        const selectPostQuery = `
        SELECT c.postIdx, c.postTitle as postName, c.mainImage, c.areaName, c.userIdx AS senderIdx, user.nickname AS senderNickname, c.sharedDate, c.senderIsRated FROM
        (SELECT b.postIdx, b.postTitle, b.mainImage, area.areaName, b.userIdx, b.sharedDate, b.senderIsRated FROM 
        (SELECT a.postIdx, post.postTitle, post.mainImage, post.userIdx, a.sharedDate, a.senderIsRated FROM
        (SELECT sharedDate, postIdx, senderIsRated FROM BabyCloset.sharingSuccess where receiverIdx = ?) as a
        JOIN post where post.postIdx = a.postIdx) as b
        JOIN
        (SELECT postAreaCategory.postIdx, areaCategory.areaName
        FROM areaCategory, postAreaCategory WHERE areaCategory.areaCategoryIdx = postAreaCategory.areaCategoryIdx) AS area
        where area.postIdx = b.postIdx) as c
        JOIN user
        WHERE user.userIdx = c.userIdx`;
        const selectPostResult = db.queryParam_Arr(selectPostQuery, [userIdx]);
        return selectPostResult;
    }
}