const db = require('../../modules/utils/db/pool');

module.exports = {
    PostRating : async (userIdx, rating)  => {
        const updateRatingQuery = `UPDATE user SET rating = IF (ratingCount = 0, ?, (rating * ratingCount + ?)/(ratingCount+1))
        WHERE userIdx = ?`
        const updateRatingCountQuery = 'UPDATE user SET ratingCount = ratingCount + 1 where userIdx = ?';
        const updateTransaction = await db.Transaction(async(connection) => {
            await connection.query(updateRatingQuery, [rating, rating, userIdx]);
            await connection.query(updateRatingCountQuery, [userIdx]);
        });
        return updateTransaction;
    },
}