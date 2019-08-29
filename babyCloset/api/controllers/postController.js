const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const db = require('../../modules/utils/db/pool');
const moment = require('moment');

module.exports = {
    RegisterPost: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const postImages = req.files;
        let deadline = req.body.deadline;
        const postTitle = req.body.title;
        const postContent = req.body.content;
        const createdTime = moment().format('YYYY-MM-DD hh:mm:ss');
        console.log(postImages);
        if(!deadline || !postTitle || !postContent || !postImages || postImages.length == 0)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            deadline = moment().add(req.body.deadline.substring(0,1), 'days').format('YYYY-MM-DD');
            const insertPostQuery = 'INSERT INTO post (postTitle, postContent, deadline, createdTime, userIdx)' +
            ' VALUES (?, ?, ?, ?, ?)';
            const insertPostImageQuery = 'INSERT INTO postImage (postImage, postIdx) VALUES (?, ?)';
            const insertTransaction = await db.Transaction(async(connection) => {
                const insertPostResult = await connection.query(insertPostQuery, [postTitle, postContent, deadline, createdTime, userIdx]);
            for(i=0; i<postImages.length ;i++)
                await connection.query(insertPostImageQuery, [postImages[i].location, insertPostResult.insertId]);
            });
            if (!insertTransaction) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('게시물')));
                } else {
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('게시물')));
            }
        }
    }
}
// 받아야 할 정보 이미지(여러 개), 카테고리(자치구, 나이, 옷 종류), 마감기한, 제목, 내용 