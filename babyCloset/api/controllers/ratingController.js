const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const ratingAccessObject = require('../dataAccessObjects/ratingAccessObject');
const db = require('../../modules/utils/db/pool');

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
    PostRating: async(req, res) => {
        const userIdx = req.body.userIdx;
        const rating = req.body.rating;
        const postIdx = req.body.postIdx;
        if(!userIdx || !rating || !postIdx)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            const checkSenderQuery = 'SELECT postIdx FROM post WHERE postIdx = ? AND userIdx = ?';
            const checkSenderResult = await db.queryParam_Arr(checkSenderQuery, [postIdx, userIdx]);
            if(!checkSenderResult)
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('별점')));
            else
            {   
                let isSender = false;
                if(checkSenderResult.length == 1)
                {
                    isSender = true;
                }
                const ratingTransaction = await ratingAccessObject.PostRating(userIdx, rating, postIdx, isSender);
                if (!ratingTransaction)
                {
                    res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('별점')));
                }
                else
                {
                    res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('별점')));
                }
            }
        }
    },
    GetRating:  async(req, res) => {
        const userIdx = req.params.userIdx;
        const getRatingResult = await ratingAccessObject.GetRating(userIdx);
        const filteredRatingResult = getRatingResult.map(e => {
            e.rating = ratingFilter(e.rating);
            return e;
        })
        if (!getRatingResult)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('별점')));
        }
        else
        {
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('별점'),
            filteredRatingResult[0]));
        }
    }
}