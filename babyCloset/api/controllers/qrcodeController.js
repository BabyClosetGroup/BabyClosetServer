const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const qrcodeAccessObject = require('../dataAccessObjects/qrCodeAccessObject');

module.exports = {
    getQrcode: async(req ,res) => {
        const postIdx = req.params.postIdx;
        const getQrcode = await qrcodeAccessObject.getQrcode(postIdx);
        if(!getQrcode)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('qr코드')));
        }
        else
        {
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('qr코드'), getQrcode[0]));
        }
    },
    authenticateQrcode: async(req, res) => {
        let decode = req.body.decode;
        decode = decode.split(",").map(item => item.trim());
        const userIdx = (decode[0].split(":").map(item => item.trim()))[1];
        const postIdx = (decode[1].split(":").map(item => item.trim()))[1];
        const authenticateQrcode = await qrcodeAccessObject.authenticateQrcode(postIdx, userIdx);
        if(!authenticateQrcode)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, "인증 실패"));
        }
        else
        {
            if(authenticateQrcode[0].isShared != 0)
                res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, "이미 인증되었습니다."));
            else if(authenticateQrcode.length == 0)
                res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, "decode가 잘못되었습니다."));
            else
            {
                
                res.status(200).send(resForm.successTrue(statusCode.OK, "인증 성공"));
            }
        }

    }
}