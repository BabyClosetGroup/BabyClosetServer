const db = require('../../modules/utils/db/pool');

module.exports = {
    PostRating : async (userIdx, rating, postIdx, isSender)  => {
        const updateRatingQuery = `UPDATE user SET rating = (rating * ratingCount + ?)/(ratingCount+1)
        WHERE userIdx = ?`
        const updateRatingCountQuery = 'UPDATE user SET ratingCount = ratingCount + 1 where userIdx = ?';
        const updateSenderIsRatedQuery = 'UPDATE sharingSuccess SET senderIsRated = 1, senderRating = ? where postIdx = ?';
        const updateReceiverIsRatedQuery = 'UPDATE sharingSuccess SET receiverIsRated = 1, receiverRating = ? where postIdx = ?';
        const updateTransaction = await db.Transaction(async(connection) => {
            await connection.query(updateRatingQuery, [rating, userIdx]);
            await connection.query(updateRatingCountQuery, [userIdx]);
            if(isSender)
            {
                await connection.query(updateSenderIsRatedQuery, [rating, postIdx]);
            }
            else
            {
                await connection.query(updateReceiverIsRatedQuery, [rating, postIdx]);
            }
        });
        return updateTransaction;
    },
    GetRating : async (userIdx) => {
        const getRatingQuery =  'SELECT userIdx, nickname, rating, profileImage FROM user WHERE userIdx = ?';
        const getRatingResult = db.queryParam_Arr(getRatingQuery, [userIdx]);
        return getRatingResult;
    }
}