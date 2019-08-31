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
                const updateMainImageQuery = `UPDATE post SET mainImage = "${postImages[0].location}" WHERE postIdx = ?`
                await connection.query(updateMainImageQuery, [postIdx]);
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
    GetDeadLinePost : async () => {
        const selectDeadlinePostQuery = `
        SELECT
        postAreaImage.postIdx, postAreaImage.postTitle, postAreaImage.deadline, postAreaImage.mainImage, areaCategory.areaName
        FROM areaCategory
        JOIN
        (SELECT postArea.postIdx, postArea.postTitle, postArea.deadline, postArea.mainImage, postArea.areaCategoryIdx
        FROM 
        (SELECT post.postIdx, post.postTitle, post.deadline, post.mainImage, postAreaCategory.areaCategoryIdx
        FROM postAreaCategory
        JOIN post ON postAreaCategory.postIdx = post.postIdx
        WHERE post.deadline <= curdate() + interval 4 day AND post.deadline > curdate() - interval 1 day)
        AS postArea)
        AS postAreaImage
        ON postAreaImage.areaCategoryIdx = areaCategory.areaCategoryIdx
        ORDER BY deadline LIMIT 3`
        const selectDeadlinePostResult = await db.queryParam_None(selectDeadlinePostQuery);
        return selectDeadlinePostResult;
    },
    GetRecentPost : async () => {
        const selectRecentPostQuery = `
        SELECT
        postAreaImage.postIdx, postAreaImage.postTitle, postAreaImage.mainImage ,areaCategory.areaName
        FROM areaCategory
        JOIN
        (SELECT postArea.postIdx, postArea.postTitle, postArea.createdTime, postArea.mainImage, postArea.areaCategoryIdx
        FROM
        (SELECT post.postIdx, post.postTitle, post.createdTime, post.mainImage, postAreaCategory.areaCategoryIdx
        FROM postAreaCategory
        JOIN post ON postAreaCategory.postIdx = post.postIdx)
        AS postArea)
        AS postAreaImage
        On postAreaImage.areaCategoryIdx = areaCategory.areaCategoryIdx
        ORDER BY createdTime DESC LIMIT 4`
        const selectRecentPostResult = await db.queryParam_None(selectRecentPostQuery);
        return selectRecentPostResult;
    },
    GetAllPost : async(offset) => {
        const selectAllPostQuery = `
        SELECT
        postAreaImage.postIdx, postAreaImage.postTitle, postAreaImage.mainImage ,areaCategory.areaName
        FROM areaCategory
        JOIN
        (SELECT postArea.postIdx, postArea.postTitle, postArea.createdTime, postArea.mainImage, postArea.areaCategoryIdx
        FROM 
        (SELECT post.postIdx, post.postTitle, post.createdTime, post.mainImage, postAreaCategory.areaCategoryIdx
        FROM postAreaCategory
        JOIN post ON postAreaCategory.postIdx = post.postIdx)
        AS postArea)
        AS postAreaImage
        On postAreaImage.areaCategoryIdx = areaCategory.areaCategoryIdx
        ORDER BY createdTime DESC LIMIT 8 OFFSET ${offset};`
        const selectAllPostResult = await db.queryParam_None(selectAllPostQuery);
        return selectAllPostResult;
    },
    GetDeadLinePostWithPagination : async (offset) => {
        const selectDeadlinePostQuery = `
        SELECT
        postAreaImage.postIdx, postAreaImage.postTitle, postAreaImage.deadline, postAreaImage.mainImage, areaCategory.areaName
        FROM areaCategory
        JOIN
        (SELECT postArea.postIdx, postArea.postTitle, postArea.deadline, postArea.mainImage, postArea.areaCategoryIdx
        FROM
        (SELECT post.postIdx, post.postTitle, post.deadline, post.mainImage, postAreaCategory.areaCategoryIdx
        FROM postAreaCategory
        JOIN post
        ON postAreaCategory.postIdx = post.postIdx
        WHERE post.deadline <= curdate() + interval 4 day AND post.deadline > curdate() - interval 1 day)
        AS postArea)
        AS postAreaImage
        ON postAreaImage.areaCategoryIdx = areaCategory.areaCategoryIdx
        ORDER BY deadline LIMIT 8 OFFSET ${offset}`
        const selectDeadlinePostResult = await db.queryParam_None(selectDeadlinePostQuery);
        return selectDeadlinePostResult;
    },
    GetDetailPost : async (postIdx) => {
        const selectDetailPostQuery = `
        SELECT detail.postIdx, detail.postTitle, detail.postContent, detail.deadline, categories.areaName, categories.ageName, categories.clothName
        FROM 
        (SELECT postArea.postIdx, postArea.postTitle, postArea.postContent, postArea.deadline FROM
        (SELECT post.postIdx, post.postTitle, post.postContent, post.deadline, postAreaCategory.areaCategoryIdx 
        FROM postAreaCategory
        JOIN post
        ON postAreaCategory.postIdx = post.postIdx)
        AS postArea
        WHERE postArea.postIdx = ${postIdx} GROUP BY postArea.postIdx) AS detail
        JOIN
        (SELECT area.postIdx, area.areaName, age.ageName, cloth.clothName
        FROM
        (SELECT postAreaCategory.postIdx, areaCategory.areaCategoryIdx, areaCategory.areaName
        FROM postAreaCategory
        JOIN areaCategory ON postAreaCategory.areaCategoryIdx = areaCategory.areaCategoryIdx)
        AS area,
        (SELECT postAgeCategory.postIdx, ageCategory.ageCategoryIdx, ageCategory.ageName
        FROM postAgeCategory
        JOIN ageCategory ON postAgeCategory.ageCategoryIdx = ageCategory.ageCategoryIdx)
        AS age,
        (SELECT postClothCategory.postIdx, clothCategory.clothCategoryIdx, clothCategory.clothName
        FROM postClothCategory
        JOIN clothCategory ON postClothCategory.clothCategoryIdx = clothCategory.clothCategoryIdx) 
        AS cloth
        WHERE area.postIdx = ${postIdx} AND area.postIdx = age.postIdx and area.postIdx = cloth.postIdx)
        AS categories
        ON categories.postIdx = detail.postIdx`
        const selectDetailPostResult = await db.queryParam_None(selectDetailPostQuery);
        return selectDetailPostResult;
    },
    GetUserAndImages : async (postIdx) => {
        const selectUserAndImageQuery = `
        SELECT user.nickname, postImage.postImage
        FROM post, user, postImage where post.postIdx=${postIdx} and postImage.postIdx = post.postIdx and post.userIdx = user.userIdx`
        const selectUserAndImageResult = await db.queryParam_None(selectUserAndImageQuery);
        return selectUserAndImageResult;
    },
    GetFilteredAllPost: async (area, age, cloth, offset) => {
        const areaArr = area.split(",").map(item => item.trim());
        const ageArr = age.split(",").map(item => item.trim());
        const clothArr = cloth.split(",").map(item => item.trim());

        function makeAreaWhereQuery(arr) {
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

        function makeAgeWhereQuery(arr) {
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

        function makeClothWhereQuery(arr) {
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
        const selectFilteredPostQuery = `
        SELECT detail.postIdx, detail.postTitle, categories.areaName, detail.mainImage
        FROM 
        (SELECT postArea.postIdx, postArea.postTitle, postArea.createdTime, postArea.mainImage
        FROM
        (SELECT post.postIdx, post.postTitle, postAreaCategory.areaCategoryIdx, post.createdTime, post.mainImage
        FROM postAreaCategory
        JOIN post
        ON postAreaCategory.postIdx = post.postIdx)
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
        ON categories.postIdx = detail.postIdx ORDER BY createdTime DESC LIMIT 8 OFFSET ${offset};`
        const selectFilteredPostResult = await db.queryParam_None(selectFilteredPostQuery);
        return selectFilteredPostResult;
    }
}