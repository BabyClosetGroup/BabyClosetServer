const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const postAccessObject = require('../dataAccessObjects/postAccessObject');
const moment = require('moment');

module.exports = {
    // 받아야 할 정보 나눔 나물 이미지(여러 개), 카테고리(자치구, 나이, 옷 종류), 마감기한, 제목, 내용 
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
    GetMainPost : async(req, res) => {
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
                post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').add(1, 'days').diff(moment(), 'days'));
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
    },
    GetAllPost: async(req, res) => {
        const getAllPost = await postAccessObject.GetAllPost((parseInt(req.params.pagination)-1)*8);
        if(!getAllPost)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredAllPost = getAllPost.map(post => {
                if(post.postTitle.length > 12)
                    post.postTitle = post.postTitle.substring(0, 12) + "..";
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                allPost : filteredAllPost
            }));
        }
    },
    GetDeadlinePost: async(req, res) => {
        const getDeadlinePost = await postAccessObject.GetDeadLinePostWithPagination((parseInt(req.params.pagination)-1)*8);
        if(!getDeadlinePost)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredDeadlinePost = getDeadlinePost.map(post => {
                if(post.postTitle.length > 12)
                    post.postTitle = post.postTitle.substring(0, 12) + "..";
                post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').add(1, 'days').diff(moment(), 'days'));
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                deadlinePost : filteredDeadlinePost
            }));
        }
    },
    GetPostDetail: async(req, res) => {
        const postIdx = req.params.postIdx;
        const getDetailPost = await postAccessObject.GetDetailPost(postIdx);
        const getUserAndImages = await postAccessObject.GetUserAndImages(postIdx);
        if(!getDetailPost || !getUserAndImages)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else if(getDetailPost.length ==0 || getUserAndImages.length == 0)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NO_X('게시물')));
        }
        else
        {
            const filteredDetailPost = getDetailPost.map(post => {
                post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').add(1, 'days').diff(moment(), 'days'));
                return post
            })
            let images = [] 
            for(i=0; i<getUserAndImages.length; i++)
                images.push(getUserAndImages[i].postImage)
            const ResData = filteredDetailPost[0];
            ResData.nickname = getUserAndImages[0].nickname;
            console.log(getUserAndImages[0])
            ResData.postImages = images;
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                detailPost : ResData
            }));
        }
    }
}  