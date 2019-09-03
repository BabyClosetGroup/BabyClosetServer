const db = require('../../modules/utils/db/pool');

module.exports = {
    PostComplain : async (userIdx, postIdx, complainReason) => {
        const insertComplainQuery = 'INSERT INTO complain (complainReason, userIdx, postIdx) VALUES (?, ?, ?)';
        const insertComplainResult = await db.queryParam_Arr(insertComplainQuery, [complainReason, userIdx, postIdx]);
        return insertComplainResult;
    }
}