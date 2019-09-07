const db = require('../../modules/utils/db/pool');

module.exports = {
    PostShare :  async (postIdx, userIdx)  => {
        const postShareQuery = `INSERT INTO sharingWant (postIdx, receiverIdx) VALUES (?, ?)`;
        const postShareResult = db.queryParam_Arr(postShareQuery, [postIdx, userIdx]);
        return postShareResult;
    },
}