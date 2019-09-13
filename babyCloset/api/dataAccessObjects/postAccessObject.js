const db = require('../../modules/utils/db/pool');
const moment = require('moment');

const makeAreaWhereQuery = (arr) => {
    for(i=0; i<arr.length; i++)
    {
        if (arr[i] == "서울 전체")
            return ""
    }
    let conditions = "";
    for(i=0; i<arr.length; i++)
    {
        const condition = `areaCategory.areaName = '${arr[i]}'`
        conditions = `${conditions} OR ${condition}`
    }
    whereStr = `WHERE ${conditions.substring(4)}`
    return whereStr
}

const makeAgeWhereQuery = (arr) => {
    for(i=0; i<arr.length; i++)
    {
        if (arr[i] == "나이 전체")
            return ""
    }
    let conditions = "";
    for(i=0; i<arr.length; i++)
    {
        const condition = `ageCategory.ageName = '${arr[i]}'`
        conditions = `${conditions} OR ${condition}`
    }
    whereStr = `WHERE ${conditions.substring(4)}`
    return whereStr
}

const makeClothWhereQuery = (arr) => {
    for(i=0; i<arr.length; i++)
    {
        if (arr[i] == "카테고리 전체")
            return ""
    }
    let conditions = "";
    for(i=0; i<arr.length; i++)
    {
        const condition = `clothCategory.clothName = '${arr[i]}'`
        conditions = `${conditions} OR ${condition}`
    }
    whereStr = `WHERE ${conditions.substring(4)}`
    return whereStr
}

module.exports = {
    RegisterPost : async (postImages, postTitle, postContent, deadline, createdTime, userIdx, areaName, ageName, clothName)  => {
        const areaArr = areaName.split(",").map(item => item.trim());
        const ageArr = ageName.split(",").map(item => item.trim());
        const clothArr = clothName.split(",").map(item => item.trim());
        const insertPostQuery = 'INSERT INTO post (postTitle, postContent, deadline, createdTime, userIdx)' +
        ' VALUES (?, ?, ?, ?, ?)';
        const insertPostImageQuery = 'INSERT INTO postImage (postImage, postIdx) VALUES (?, ?)';
        const insertAreaCategoryQuery = 'INSERT INTO areaCategory (areaName) VALUES (?)';
        const insertAgeCategoryQuery = 'INSERT INTO ageCategory (ageName) VALUES (?)';
        const insertClothCategoryQuery = 'INSERT INTO clothCategory (clothName) VALUES (?)';
        const insertPostAreaCategoryQuery = 'INSERT INTO postAreaCategory (postIdx, areaCategoryIdx) VALUES (?, ?)';
        const insertPostAgeCategoryQuery = 'INSERT INTO postAgeCategory (postIdx, ageCategoryIdx) VALUES (?, ?)';
        const insertPostClothCategoryQuery = 'INSERT INTO postClothCategory (postIdx, clothCategoryIdx) VALUES (?, ?)';
        let postIdx;
        const insertTransaction = await db.Transaction(async(connection) => {
            const insertPostResult = await connection.query(insertPostQuery, [postTitle, postContent, deadline, createdTime, userIdx]);
            postIdx = insertPostResult.insertId;
            for(i=0; i<postImages.length ;i++)
                await connection.query(insertPostImageQuery, [postImages[i].location, postIdx]);
            const updateMainImageQuery = `UPDATE post SET mainImage = "${postImages[0].location}" WHERE postIdx = ?`
            await connection.query(updateMainImageQuery, [postIdx]);
            for(i=0; i<areaArr.length; i++)
            {
                const insertAreaCategoryResult = await connection.query(insertAreaCategoryQuery, [areaArr[i]]);
                const areaCategoryIdx = insertAreaCategoryResult.insertId;
                await connection.query(insertPostAreaCategoryQuery, [postIdx, areaCategoryIdx]);
            }
            for(i=0; i<ageArr.length; i++)
            {
                const insertAgeCategoryResult = await connection.query(insertAgeCategoryQuery, [ageArr[i]]);
                const ageCategoryIdx = insertAgeCategoryResult.insertId;
                await connection.query(insertPostAgeCategoryQuery, [postIdx, ageCategoryIdx]);
            }
            for(i=0; i<clothArr.length; i++)
            {
                const insertClothCategoryResult = await connection.query(insertClothCategoryQuery, [clothArr[i]]);
                const clothCategoryIdx = insertClothCategoryResult.insertId;
                await connection.query(insertPostClothCategoryQuery, [postIdx, clothCategoryIdx]);
            }
            });
        return {result: insertTransaction, postIdx};
    },
    GetDeadLinePost : async () => {
        const selectDeadlinePostQuery = `
        SELECT postIdx, postTitle, deadline, mainImage FROM post
        WHERE deadline <= curdate() + interval 5 day AND deadline > curdate() - interval 1 day
        ORDER BY deadline LIMIT 3`;
        const selectDeadlinePostResult = await db.queryParam_None(selectDeadlinePostQuery);
        return selectDeadlinePostResult;
    },
    GetRecentPost : async () => {
        const selectRecentPostQuery = `
        SELECT postIdx, postTitle, deadline, mainImage FROM post
        WHERE deadline <= curdate() + interval 5 day AND deadline > curdate() - interval 1 day
        ORDER BY createdTime DESC LIMIT 4`;
        const selectRecentPostResult = await db.queryParam_None(selectRecentPostQuery);
        return selectRecentPostResult;
    },
    GetAllPost : async(offset) => {
        const selectAllPostQuery = `
        SELECT postIdx, postTitle, mainImage FROM post
        WHERE deadline <= curdate() + interval 5 day AND deadline > curdate() - interval 1 day
        ORDER BY createdTime DESC LIMIT 8 OFFSET ?;`;
        const selectAllPostResult = await db.queryParam_Arr(selectAllPostQuery, [offset]);
        return selectAllPostResult;
    },
    GetDeadLinePostWithPagination : async (offset) => {
        const selectDeadlinePostQuery = `
        SELECT postIdx, postTitle, deadline, mainImage FROM post
        WHERE deadline <= curdate() + interval 5 day AND deadline > curdate() - interval 1 day
        ORDER BY deadline LIMIT 8 OFFSET ?`;
        const selectDeadlinePostResult = await db.queryParam_Arr(selectDeadlinePostQuery, [offset]);
        return selectDeadlinePostResult;
    },
    GetDetailPost : async (postIdx) => {
        const selectDetailPostQuery = `
        SELECT postIdx, postTitle, postContent, deadline FROM post WHERE postIdx = ?`
        const selectDetailPostResult = await db.queryParam_Arr(selectDetailPostQuery, [postIdx]);
        return selectDetailPostResult;
    },
    GetUserAndImages : async (postIdx) => {
        const selectUserAndImageQuery = `
        SELECT user.nickname, user.userIdx, user.rating, postImage.postImage
        FROM post, user, postImage where post.postIdx=${postIdx} and postImage.postIdx = post.postIdx and post.userIdx = user.userIdx`;
        const selectUserAndImageResult = await db.queryParam_None(selectUserAndImageQuery);
        return selectUserAndImageResult;
    },
    GetFilteredAllPost: async (area, age, cloth, offset) => {
        const areaArr = area.split(",").map(item => item.trim());
        const ageArr = age.split(",").map(item => item.trim());
        const clothArr = cloth.split(",").map(item => item.trim());
        const selectFilteredPostQuery = `
        SELECT detail.postIdx, detail.postTitle, categories.areaName, detail.mainImage
        FROM 
        (SELECT postArea.postIdx, postArea.postTitle, postArea.createdTime, postArea.mainImage
        FROM
        (SELECT post.postIdx, post.postTitle, postAreaCategory.areaCategoryIdx, post.createdTime, post.mainImage
        FROM postAreaCategory
        JOIN post
        ON post.deadline <= curdate() + interval 5 day AND post.deadline > curdate() - interval 1 day
        AND postAreaCategory.postIdx = post.postIdx)
        AS postArea) AS detail
        JOIN
        (SELECT area.postIdx, area.areaName, age.ageName, cloth.clothName
        FROM
        (SELECT postAreaCategory.postIdx, areaCategory.areaCategoryIdx, areaCategory.areaName
        FROM postAreaCategory
        JOIN areaCategory ON postAreaCategory.areaCategoryIdx = areaCategory.areaCategoryIdx ${makeAreaWhereQuery(areaArr)})
        AS area,
        (SELECT postAgeCategory.postIdx, ageCategory.ageCategoryIdx, ageCategory.ageName
        FROM postAgeCategory
        JOIN ageCategory ON postAgeCategory.ageCategoryIdx = ageCategory.ageCategoryIdx ${makeAgeWhereQuery(ageArr)})
        AS age,
        (SELECT postClothCategory.postIdx, clothCategory.clothCategoryIdx, clothCategory.clothName
        FROM postClothCategory
        JOIN clothCategory ON postClothCategory.clothCategoryIdx = clothCategory.clothCategoryIdx ${makeClothWhereQuery(clothArr)}) 
        AS cloth
        WHERE area.postIdx = age.postIdx AND area.postIdx = cloth.postIdx)
        AS categories
        ON categories.postIdx = detail.postIdx GROUP BY detail.postIdx ORDER BY createdTime DESC LIMIT 8 OFFSET ${offset}`;
        const selectFilteredPostResult = await db.queryParam_None(selectFilteredPostQuery);
        return selectFilteredPostResult;
    },
    GetFilteredDeadlinePost: async(area, age, cloth, offset) => {

        const areaArr = area.split(",").map(item => item.trim());
        const ageArr = age.split(",").map(item => item.trim());
        const clothArr = cloth.split(",").map(item => item.trim());
        const selectFilteredPostQuery = `
        SELECT detail.postIdx, detail.postTitle, categories.areaName, detail.deadline, detail.mainImage
        FROM 
        (SELECT postArea.postIdx, postArea.postTitle, postArea.deadline, postArea.mainImage
        FROM
        (SELECT post.postIdx, post.postTitle, postAreaCategory.areaCategoryIdx, post.deadline, post.mainImage
        FROM postAreaCategory
        JOIN post
        ON post.deadline <= curdate() + interval 4 day AND post.deadline > curdate() - interval 1 day
        AND  postAreaCategory.postIdx = post.postIdx)
        AS postArea
        GROUP BY postArea.postIdx) AS detail
        JOIN
        (SELECT area.postIdx, area.areaName, age.ageName, cloth.clothName
        FROM
        (SELECT postAreaCategory.postIdx, areaCategory.areaCategoryIdx, areaCategory.areaName
        FROM postAreaCategory
        JOIN areaCategory ON postAreaCategory.areaCategoryIdx = areaCategory.areaCategoryIdx ${makeAreaWhereQuery(areaArr)})
        AS area,
        (SELECT postAgeCategory.postIdx, ageCategory.ageCategoryIdx, ageCategory.ageName
        FROM postAgeCategory
        JOIN ageCategory ON postAgeCategory.ageCategoryIdx = ageCategory.ageCategoryIdx ${makeAgeWhereQuery(ageArr)})
        AS age,
        (SELECT postClothCategory.postIdx, clothCategory.clothCategoryIdx, clothCategory.clothName
        FROM postClothCategory
        JOIN clothCategory ON postClothCategory.clothCategoryIdx = clothCategory.clothCategoryIdx ${makeClothWhereQuery(clothArr)}) 
        AS cloth
        WHERE area.postIdx = age.postIdx AND area.postIdx = cloth.postIdx)
        AS categories
        ON categories.postIdx = detail.postIdx GROUP BY detail.postIdx ORDER BY deadline LIMIT 8 OFFSET ${offset}`;
        const selectFilteredPostResult = await db.queryParam_None(selectFilteredPostQuery);
        return selectFilteredPostResult;
    },
    UpdatePost: async(title, content, deadline, areaCategory, ageCategory, clothCategory, postImages, postIdx) => {
        const deleteAgeCategoryQuery = `
        DELETE FROM ageCategory WHERE
        ageCategory.ageCategoryIdx IN 
        (SELECT * FROM
        (SELECT ageCategory.ageCategoryIdx FROM ageCategory, postAgeCategory
        WHERE postAgeCategory.ageCategoryIdx = ageCategory.ageCategoryIdx
        AND postAgeCategory.postIdx = ?) AS result);`;
        const deleteAreaCategoryQuery = `
        DELETE FROM areaCategory WHERE
        areaCategory.areaCategoryIdx IN 
        (SELECT * FROM
        (SELECT areaCategory.areaCategoryIdx FROM areaCategory, postAreaCategory
        WHERE postAreaCategory.areaCategoryIdx = areaCategory.areaCategoryIdx
        AND postAreaCategory.postIdx = ?) AS result);`;
        const deleteClothCategoryQuery = `
        DELETE FROM clothCategory WHERE
        clothCategory.clothCategoryIdx IN 
        (SELECT * FROM
        (SELECT clothCategory.clothCategoryIdx FROM clothCategory, postClothCategory
        WHERE postClothCategory.clothCategoryIdx = clothCategory.clothCategoryIdx
        AND postClothCategory.postIdx = ?) AS result);`;
        const insertAreaCategoryQuery = 'INSERT INTO areaCategory (areaName) VALUES (?)';
        const insertAgeCategoryQuery = 'INSERT INTO ageCategory (ageName) VALUES (?)';
        const insertClothCategoryQuery = 'INSERT INTO clothCategory (clothName) VALUES (?)';
        const insertPostAreaCategoryQuery = 'INSERT INTO postAreaCategory (postIdx, areaCategoryIdx) VALUES (?, ?)';
        const insertPostAgeCategoryQuery = 'INSERT INTO postAgeCategory (postIdx, ageCategoryIdx) VALUES (?, ?)';
        const insertPostClothCategoryQuery = 'INSERT INTO postClothCategory (postIdx, clothCategoryIdx) VALUES (?, ?)';
        const updateTitleQuery = 'UPDATE post SET postTitle = ? WHERE post.postIdx = ?';
        const updateContentQuery = 'UPDATE post SET postContent = ? WHERE post.postIdx = ?';
        const updateDeadlineQuery = 'UPDATE post SET deadline = ? WHERE post.postIdx = ?';
        const deleteImagesQuery = 'DELETE FROM postImage WHERE postImage.postIdx = ?';
        const insertImagesQuery = 'INSERT INTO postImage (postImage, postIdx) VALUES (?, ?)';
        const updateMainImageQuery = 'UPDATE post SET mainImage = ? WHERE post.postIdx = ?';
        const updateTransaction = await db.Transaction(async(connection) => {
            if(title)
                await connection.query(updateTitleQuery, [title, postIdx]);
            if(content)
                await connection.query(updateContentQuery, [content, postIdx]);
            if(deadline)
            {
                deadline = moment().add(deadline.substring(0,1), 'days').format('YYYY-MM-DD');
                await connection.query(updateDeadlineQuery, [deadline, postIdx]);
            }
            if(ageCategory)
            {
                const ageArr = ageCategory.split(",").map(item => item.trim());
                await connection.query(deleteAgeCategoryQuery, [postIdx]);
                for(i=0; i<ageArr.length; i++)
                {
                    const insertAgeCategoryResult = await connection.query(insertAgeCategoryQuery, [ageArr[i]]);
                    const ageCategoryIdx = insertAgeCategoryResult.insertId;
                    await connection.query(insertPostAgeCategoryQuery, [postIdx, ageCategoryIdx]);
                }
            }
            if(areaCategory)
            {
                const areaArr = areaCategory.split(",").map(item => item.trim());
                await connection.query(deleteAreaCategoryQuery, [postIdx]);
                for(i=0; i<areaArr.length; i++)
                {
                    const insertAreaCategoryResult = await connection.query(insertAreaCategoryQuery, [areaArr[i]]);
                    const areaCategoryIdx = insertAreaCategoryResult.insertId;
                    await connection.query(insertPostAreaCategoryQuery, [postIdx, areaCategoryIdx]);
                }
            }
            if(clothCategory)
            {
                const clothArr = clothCategory.split(",").map(item => item.trim());
                await connection.query(deleteClothCategoryQuery, [postIdx]);
                for(i=0; i<clothArr.length; i++)
                {
                    const insertClothCategoryResult = await connection.query(insertClothCategoryQuery, [clothArr[i]]);
                    const clothCategoryIdx = insertClothCategoryResult.insertId;
                    await connection.query(insertPostClothCategoryQuery, [postIdx, clothCategoryIdx]);
                }
            }
            if(postImages.length != 0)
            {
                await connection.query(deleteImagesQuery, [postIdx]);
                for(i=0; i<postImages.length ;i++)
                    await connection.query(insertImagesQuery, [postImages[i].location, postIdx]);
                await connection.query(updateMainImageQuery, [postImages[0].location, postIdx]);
            }
        })
        return updateTransaction;
    },
    DeletePost: async(postIdx) => {
        const deleteAgeCategoryQuery = `
        DELETE FROM ageCategory WHERE
        ageCategory.ageCategoryIdx IN 
        (SELECT * FROM
        (SELECT ageCategory.ageCategoryIdx FROM ageCategory, postAgeCategory
        WHERE postAgeCategory.ageCategoryIdx = ageCategory.ageCategoryIdx
        AND postAgeCategory.postIdx = ?) AS result);`;
        const deleteAreaCategoryQuery = `
        DELETE FROM areaCategory WHERE
        areaCategory.areaCategoryIdx IN 
        (SELECT * FROM
        (SELECT areaCategory.areaCategoryIdx FROM areaCategory, postAreaCategory
        WHERE postAreaCategory.areaCategoryIdx = areaCategory.areaCategoryIdx
        AND postAreaCategory.postIdx = ?) AS result);`;
        const deleteClothCategoryQuery = `
        DELETE FROM clothCategory WHERE
        clothCategory.clothCategoryIdx IN 
        (SELECT * FROM
        (SELECT clothCategory.clothCategoryIdx FROM clothCategory, postClothCategory
        WHERE postClothCategory.clothCategoryIdx = clothCategory.clothCategoryIdx
        AND postClothCategory.postIdx = ?) AS result);`;
        const deletePostQuery = 'DELETE FROM post WHERE post.postIdx = ?';
        const deleteTransaction = await db.Transaction(async(connection) => {
            await connection.query(deleteAgeCategoryQuery, [postIdx]);
            await connection.query(deleteAreaCategoryQuery, [postIdx]);
            await connection.query(deleteClothCategoryQuery, [postIdx]);
            await connection.query(deletePostQuery, [postIdx]);
        })
        return deleteTransaction;
    },
    QRCodePost : async(userIdx) => {
        const selectPostQuery = 
        `SELECT postIdx, postTitle, mainImage FROM post WHERE isShared = 0 AND userIdx = ?`;
        const selectPostResult = await db.queryParam_Arr(selectPostQuery, [userIdx]);
        return selectPostResult;
    }
}