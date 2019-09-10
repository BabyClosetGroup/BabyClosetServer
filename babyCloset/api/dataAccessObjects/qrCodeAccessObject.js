const db = require('../../modules/utils/db/pool');

module.exports = {
    updateQrcodeImage : async (userIdx, postIdx) => {
        const updateQrcodeImageQuery =  `UPDATE post SET
        qrcode = "https://sopt24server.s3.ap-northeast-2.amazonaws.com/${userIdx}and${postIdx}.png"
        WHERE postIdx = ?`;
        const updateQrcodeImageResult = db.queryParam_Arr(updateQrcodeImageQuery, [postIdx]);
        return updateQrcodeImageResult;
    }
}

//https://sopt24server.s3.ap-northeast-2.amazonaws.com/2and36.png
