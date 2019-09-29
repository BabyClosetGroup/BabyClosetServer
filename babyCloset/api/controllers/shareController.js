const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const shareAccessObject = require('../dataAccessObjects/shareAccessObject');
const moment = require('moment');
const db = require('../../modules/utils/db/pool');

const matchAreaWithPost = (selectAreaResult, getPost) => {
    var num = 0;
    let arr = [];
    do
    {
        let tmpArr = [];
        tmpArr.push(selectAreaResult[num]);
        while(num<selectAreaResult.length-1 &&
            selectAreaResult[num].postIdx == selectAreaResult[num+1].postIdx)
        {
            tmpArr.push(selectAreaResult[num+1]);
            num++;
        }
        arr.push(tmpArr);
        num++;
    } while(num<selectAreaResult.length);
    for(k=0; k<getPost.length ;k++)
    {
        for(i=0; i<arr.length;i++)
        {
            if(getPost[k].postIdx == arr[i][0].postIdx)
            {
                let areaArray = [];
                for(j=0; j<arr[i].length ;j++)
                {
                    areaArray.push(arr[i][j].areaName);
                }
                getPost[k].areaName = areaArray;
                break;
            }
        }
    }
}

const ratingFilter =  (rating) => {
    const floor = (rating-Math.floor(rating));
    if(0 <= floor && floor < 0.5)
    {
        floor-0.25 < 0 ? rating = rating-floor : rating = Math.floor(rating)+0.5;
    }
    else
    {
        floor-0.75 >= 0 ? rating = rating - floor + 1 : rating = Math.floor(rating)+0.5;
    }
    return rating;
}

module.exports = {
    PostShare : async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const postIdx = req.body.postIdx;
        if(!postIdx)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            const checkQuery = `SELECT * FROM sharingWant where postIdx = ? AND applicantIdx = ?`;
            const checkResult = await db.queryParam_Arr(checkQuery, [postIdx, userIdx]);
            if(!checkResult)
            {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('나눔')));
            }
            else
            {
                console.log(checkResult);
                if(checkResult.length == 1)
                    res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.ALREADY_X('나눔 신청')));
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
            let allStr = "";
            for(i=0; i<getUncompletedResult.length; i++)
            {
                allStr = allStr + `postIdx = ${getUncompletedResult[i].postIdx} OR `;
            }
            allStr = allStr.substring(0, allStr.length-4);
            if(allStr.length == 0)
            {
                allStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQuery = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ allStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResult = await db.queryParam_None(selectAreaQuery);
            if(!selectAreaResult)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResult, getUncompletedResult);
            }
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
            let allStr = "";
            for(i=0; i<getPostResult.length; i++)
            {
                allStr = allStr + `postIdx = ${getPostResult[i].postIdx} OR `;
            }
            allStr = allStr.substring(0, allStr.length-4);
            if(allStr.length == 0)
            {
                allStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQuery = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ allStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResult = await db.queryParam_None(selectAreaQuery);
            if(!selectAreaResult)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResult, getPostResult);
            }
            const filteredPostResult = getPostResult.map(e => {
                e.applicantNumber = e.applicantNumber+"명";
                return e;
            })
            const filteredApplicantResult = getApplicantResult.map(e => {
                e.rating = ratingFilter(e.rating);
                return e;
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('신청자'), {
                post: filteredPostResult[0],
                applicants: filteredApplicantResult
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
            let allStr = "";
            for(i=0; i<getCompletedResult.length; i++)
            {
                allStr = allStr + `postIdx = ${getCompletedResult[i].postIdx} OR `;
            }
            allStr = allStr.substring(0, allStr.length-4);
            if(allStr.length == 0)
            {
                allStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQuery = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ allStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResult = await db.queryParam_None(selectAreaQuery);
            if(!selectAreaResult)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResult, getCompletedResult);
            }
            const filteredPost = getCompletedResult.map(post => {
                post.sharedDate = moment(post.sharedDate).format('YYYY. MM. DD');
                post.rating = ratingFilter(post.rating);
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
            let allStr = "";
            for(i=0; i<getReceivedResult.length; i++)
            {
                allStr = allStr + `postIdx = ${getReceivedResult[i].postIdx} OR `;
            }
            allStr = allStr.substring(0, allStr.length-4);
            if(allStr.length == 0)
            {
                allStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQuery = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ allStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResult = await db.queryParam_None(selectAreaQuery);
            if(!selectAreaResult)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResult, getReceivedResult);
            }
            const filteredPost = getReceivedResult.map(post => {
                post.sharedDate = moment(post.sharedDate).format('YYYY. MM. DD');
                post.rating = ratingFilter(post.rating);
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'), {
                allPost: filteredPost
            }));
        }
    }
}