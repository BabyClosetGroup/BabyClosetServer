const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const shareAccessObject = require('../dataAccessObjects/shareAccessObject');
const moment = require('moment');

module.exports = {
    PostShare : async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const postIdx = req.body.postIdx;
        console.log(userIdx)
        if(!postIdx)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            const postShareResult = shareAccessObject.PostShare(postIdx, userIdx);
            if (!postShareResult)
            {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('나눔')));
            }
            else
            {
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('나눔')));
            }
        }
    },
    GetUncompleted: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const getUncompletedResult = await shareAccessObject.GetUncompletedShare(userIdx);
        if (!getUncompletedResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredPost = getUncompletedResult.map(post => {
                post.registerNumber = post.registerNumber+'명';
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'), {
                allPost: filteredPost
            }));
        }
    },
    GetApplicant: async(req, res) => {
        const postIdx = req.params.postIdx;
        const getPostResult = await shareAccessObject.GetDetailUncompletedShare(postIdx);
        const getApplicantResult = await shareAccessObject.GetApplicantInformation(postIdx);

        if(!getPostResult || !getApplicantResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('신청자')));
        }
        else
        {
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('신청자'), {
                post: getPostResult[0],
                applicants: getApplicantResult
            }));
        }
    },
    GetCompleted: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const getCompletedResult = await shareAccessObject.GetCompletedShare(userIdx);
        if (!getCompletedResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredPost = getCompletedResult.map(post => {
                post.sharedDate = moment(post.sharedDate).format('YYYY. MM. DD');
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'), {
                allPost: filteredPost
            }));
        }
    },
    GetReceived: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const getReceivedResult = await shareAccessObject.GetReceivedShare(userIdx);
        if (!getReceivedResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            const filteredPost = getReceivedResult.map(post => {
                post.sharedDate = moment(post.sharedDate).format('YYYY. MM. DD');
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'), {
                allPost: filteredPost
            }));
        }
    }
}