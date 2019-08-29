const db = require('../../modules/utils/db/pool');

module.exports = {
    RegisterPost : async (postImages, postTitle, postContent, deadline, createdTime, userIdx, areaName, ageName, clothName)  => {
        const insertPostQuery = 'INSERT INTO post (postTitle, postContent, deadline, createdTime, userIdx)' +
            ' VALUES (?, ?, ?, ?, ?)';
            const insertPostImageQuery = 'INSERT INTO postImage (postImage, postIdx) VALUES (?, ?)';
            const insertAreaCategoryQuery = 'INSERT INTO areaCategory (areaName) VALUES (?)';
            const insertAgeCategoryQuery = 'INSERT INTO ageCategory (ageName) VALUES (?)';
            const insertClothCategoryQuery = 'INSERT INTO clothCategory (clothName) VALUES (?)';
            const insertPostAreaCategoryQuery = 'INSERT INTO postAreaCategory (postIdx, areaCategoryIdx) VALUES (?, ?)';
            const insertPostAgeCategoryQuery = 'INSERT INTO postAgeCategory (postIdx, ageCategoryIdx) VALUES (?, ?)';
            const insertPostClothCategoryQuery = 'INSERT INTO postClothCategory (postIdx, clothCategoryIdx) VALUES (?, ?)';
            const insertTransaction = await db.Transaction(async(connection) => {
                const insertPostResult = await connection.query(insertPostQuery, [postTitle, postContent, deadline, createdTime, userIdx]);
                const postIdx = insertPostResult.insertId;
                for(i=0; i<postImages.length ;i++)
                    await connection.query(insertPostImageQuery, [postImages[i].location, postIdx]);
                const insertAreaCategoryResult = await connection.query(insertAreaCategoryQuery, [areaName]);
                const insertAgeCategoryResult = await connection.query(insertAgeCategoryQuery, [ageName]);
                const insertClothCategoryResult = await connection.query(insertClothCategoryQuery, [clothName]);
                const areaCategoryIdx = insertAreaCategoryResult.insertId;
                const ageCategoryIdx = insertAgeCategoryResult.insertId;
                const clothCategoryIdx = insertClothCategoryResult.insertId;
                await connection.query(insertPostAreaCategoryQuery, [postIdx, areaCategoryIdx]);
                await connection.query(insertPostAgeCategoryQuery, [postIdx, ageCategoryIdx]);
                await connection.query(insertPostClothCategoryQuery, [postIdx, clothCategoryIdx]);
                });
            return insertTransaction;
    },
}