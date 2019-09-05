const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const ratingAccessObject = require('../dataAccessObjects/ratingAccessObject');
const moment = require('moment');

module.exports = {
    PostRating: async(req, res) => {
        const userIdx = req.body.userIdx;
        const rating = req.body.rating;
        if(!userIdx || !rating)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            const ratingTransaction = await ratingAccessObject.PostRating(userIdx, rating);
            if (!ratingTransaction)
            {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('별점')));
            }
            else
            {
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('별점')));
            }
        }
    },
}