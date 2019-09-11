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
    },
    authenticateQrcode: async (postIdx, userIdx) => {
        const authenticateQrcodeQuery = 'SELECT postIdx, isShared FROM post WHERE postIdx = ? AND userIdx = ?';
        const authenticateQrcodeResult = db.queryParam_Arr(authenticateQrcodeQuery, [postIdx, userIdx]);
        return authenticateQrcodeResult;
    },
    postSharingSuccess: async (receiverIdx, sharedDate, postIdx) => {
        const postSharingSuccessQuery = 'INSERT INTO sharingSuccess (receiverIdx, sharedDate, postIdx) VALUES (?, ?, ?)';
        const postSharingSuccessResult = db.queryParam_Arr(postSharingSuccessQuery, [receiverIdx, sharedDate, postIdx]);
        return postSharingSuccessResult;
    }
}