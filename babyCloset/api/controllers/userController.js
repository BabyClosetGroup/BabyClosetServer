const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const db = require('../../modules/utils/db/pool');
const crypto = require('crypto-promise');
const jwt = require('../../modules/utils/security/jwt');

// 이름, 아이디, 비밀번호, 닉네임

module.exports = {
    SignUp: async(req, res) => {
        let check = true;
        if(!req.body.id || !req.body.name || !req.body.password || !req.body.nickname)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else{
            const getAllUserQuery = 'SELECT userId, nickname FROM user';
            const getAllUserResult = await db.queryParam_None(getAllUserQuery);
            if (!getAllUserResult) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.USER_SELECT_FAIL));
            } else {
                getAllUserResult.forEach((user) => {
                    if(user.userId == req.body.id)
                    {
                        res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.USER_ALREADY_EXISTS));
                        check = false;
                    }
                })
                getAllUserResult.forEach((user) => {
                    if(user.nickname == req.body.nickname)
                    {
                        res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NICKNAME_ALREADY_EXISTS));
                        check = false;
                    }
                })
                if(check)
                {
                    const salt = await crypto.randomBytes(32);
                    const password = await crypto.pbkdf2(req.body.password, salt.toString('base64'), 1000, 32, 'SHA512');
                    const insertUserQuery = 'INSERT INTO user (username, userId, password, salt, nickname) VALUES (?, ?, ?, ?, ?)';
                    const insertUserResult = await db.queryParam_Arr(insertUserQuery,
                        [req.body.name, req.body.id, password.toString('base64'), salt.toString('base64'), req.body.nickname]);
                    if (!insertUserResult) {
                        res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.USER_INSERT_FAIL));
                    } else { 
                        res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.USER_INSERT_SUCCESS));
                    }
                }
            }
        }
    }
}
