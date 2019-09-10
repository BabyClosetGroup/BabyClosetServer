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
    }
}