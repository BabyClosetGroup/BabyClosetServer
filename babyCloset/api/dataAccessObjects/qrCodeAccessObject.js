const db = require('../../modules/utils/db/pool');

module.exports = {
    updateQrcodeImage : async (userIdx, postIdx) => {
        const updateQrcodeImageQuery =  `UPDATE post SET
        qrcode = "https://sopt24server.s3.ap-northeast-2.amazonaws.com/${userIdx}and${postIdx}.png"
        WHERE postIdx = ?`;
        const updateQrcodeImageResult = db.queryParam_Arr(updateQrcodeImageQuery, [postIdx]);
        return updateQrcodeImageResult;
    },
    getQrcode : async (postIdx) => {
        const selectQrcodeQuery = 'SELECT postIdx, postTitle, qrcode FROM post WHERE postIdx = ?';
        const selectQrcodeResult = db.queryParam_Arr(selectQrcodeQuery, [postIdx]);
        return selectQrcodeResult;
    }
} 