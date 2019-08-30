const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const postAccessObject = require('../dataAccessObjects/postAccessObject');
const moment = require('moment');

module.exports = {
    RegisterPost: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const postImages = req.files;
        let deadline = req.body.deadline;
        const postTitle = req.body.title;
        const postContent = req.body.content;
        const createdTime = moment().format('YYYY-MM-DD hh:mm:ss');
        const areaName = req.body.areaCategory;
        const ageName = req.body.ageCategory;
        const clothName = req.body.clothCategory;
        console.log(postImages);
        if(!deadline || !postTitle || !postContent || !postImages || postImages.length == 0 ||
            !areaName || !ageName|| !clothName)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            deadline = moment().add(req.body.deadline.substring(0,1), 'days').format('YYYY-MM-DD');
            const insertTransaction = await postAccessObject.RegisterPost(postImages, postTitle, postContent, deadline, createdTime, userIdx, areaName, ageName, clothName)
            if (!insertTransaction) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('게시물')));
                } else {
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('게시물')));
            }
        }
    },
        // 받아야 할 정보 나눔 나물 이미지(여러 개), 카테고리(자치구, 나이, 옷 종류), 마감기한, 제목, 내용 
    mainPost : async(req, res) => {
        const getDeadLinePost = await postAccessObject.GetDeadLinePost();
        const getRecentPost = await postAccessObject.GetRecentPost();
        if(!getDeadLinePost || !getRecentPost)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredDeadlinePost = getDeadLinePost.map(post => {
                if(post.postTitle.length > 8)
                    post.postTitle = post.postTitle.substring(0, 8) + "..";
                post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').diff(moment(), 'days'));
                return post
            })
            const filteredRecentPost = getRecentPost.map(post => {
                if(post.postTitle.length > 11)
                    post.postTitle = post.postTitle.substring(0, 11) + "..";
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                deadlinePost : filteredDeadlinePost,
                recentPost : filteredRecentPost
            }));
        }
    }
}