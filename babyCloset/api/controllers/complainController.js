const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const complainAccessObject = require('../dataAccessObjects/complainAccessObject');


module.exports = {
    PostComplain : async(req, res) => {
        const complainReason = req.body.complainReason;
        const userIdx = req.decoded.userIdx;
        const postIdx = req.body.postIdx;
        if(!complainReason || !postIdx)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            const insertComplain = await complainAccessObject.PostComplain(userIdx, postIdx, complainReason)
            if (!insertComplain) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('신고')));
            }
            else
            {
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('신고')));
            }
        }
    }
}