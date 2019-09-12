const db = require('../../modules/utils/db/pool');

module.exports = {
    PostRating : async (userIdx, rating, postIdx)  => {
        const updateRatingQuery = `UPDATE user SET rating = (rating * ratingCount + ?)/(ratingCount+1)
        WHERE userIdx = ?`
        const updateRatingCountQuery = 'UPDATE user SET ratingCount = ratingCount + 1 where userIdx = ?';
        const updateTransaction = await db.Transaction(async(connection) => {
            await connection.query(updateRatingQuery, [rating, userIdx]);
            await connection.query(updateRatingCountQuery, [userIdx]);
        });
        return updateTransaction;
    },
    GetRating : async (userIdx) => {
        const getRatingQuery =  'SELECT userIdx, nickname, rating FROM user WHERE userIdx = ?';
        const getRatingResult = db.queryParam_Arr(getRatingQuery, [userIdx]);
        return getRatingResult;
    }
}