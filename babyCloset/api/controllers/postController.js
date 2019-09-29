const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const postAccessObject = require('../dataAccessObjects/postAccessObject');
const noteAccessObject = require('../dataAccessObjects/noteAccessObject');
const qrCodeAccessObject = require('../dataAccessObjects/qrCodeAccessObject');
const moment = require('moment');
const qrcodeGenerator = require('../../modules/utils/qrcodeGenerator');
const db = require('../../modules/utils/db/pool');
require('events').EventEmitter.defaultMaxListeners = 25;

const matchAreaWithPost = (selectAreaResult, getPost) => {
    var num = 0;
    let arr = [];
    do
    {
        let tmpArr = [];
        tmpArr.push(selectAreaResult[num]);
        while(num<selectAreaResult.length-1 &&
            selectAreaResult[num].postIdx == selectAreaResult[num+1].postIdx)
        {
            tmpArr.push(selectAreaResult[num+1]);
            num++;
        }
        arr.push(tmpArr);
        num++;
    } while(num<selectAreaResult.length);
    for(k=0; k<getPost.length ;k++)
    {
        for(i=0; i<arr.length;i++)
        {
            if(getPost[k].postIdx == arr[i][0].postIdx)
            {
                let areaArray = [];
                for(j=0; j<arr[i].length ;j++)
                {
                    areaArray.push(arr[i][j].areaName);
                }
                getPost[k].areaName = areaArray;
                break;
            }
        }
    }
}

const ratingFilter =  (rating) => {
    const floor = (rating-Math.floor(rating));
    if(0 <= floor && floor < 0.5)
    {
        floor-0.25 < 0 ? rating = rating-floor : rating = Math.floor(rating)+0.5;
    }
    else
    {
        floor-0.75 >= 0 ? rating = rating - floor + 1 : rating = Math.floor(rating)+0.5;
    }
    return rating;
}

module.exports = {
    // 받아야 할 정보 나눔 나물 이미지(여러 개), 카테고리(자치구, 나이, 옷 종류), 마감기한, 제목, 내용 
    RegisterPost: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        const postImages = req.files;
        let deadline = req.body.deadline;
        const postTitle = req.body.title;
        const postContent = req.body.content;
        const createdTime = moment().format('YYYY-MM-DD hh:mm:ss');
        const areaName = req.body.areaCategory;
        const ageName = req.body.ageCategory;
        const clothName = req.body.clothCategory;
        if(!deadline || !postTitle || !postContent || !postImages || postImages.length == 0 ||
            !areaName || !ageName|| !clothName)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        else
        {
            deadline = moment().add(req.body.deadline.substring(0,1), 'days').format('YYYY-MM-DD');
            const insertTransaction = await postAccessObject.RegisterPost(postImages, postTitle, postContent, deadline, createdTime, userIdx, areaName, ageName, clothName)
            if (!insertTransaction.result) {
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('게시물')));
            }
            else
            {
                qrcodeGenerator.makeQrcode(userIdx, insertTransaction.postIdx);
                const updateQrcode = qrCodeAccessObject.updateQrcodeImage(userIdx, insertTransaction.postIdx);
                if(!updateQrcode)
                {
                    res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_CREATED_X('게시물')));
                }
                else
                {
                    res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.CREATED_X('게시물'), {
                        postIdx: insertTransaction.postIdx
                    }));
                }
            }
        }
    },
    GetMainPost : async(req, res) => {
        const confirmNewMessage = await noteAccessObject.ConfirmNewMessage(req.decoded.userIdx);
        const getMainPosts = await postAccessObject.GetMainPost();
        const getDeadLinePost = getMainPosts.result1;
        const getRecentPost = getMainPosts.result2;
        if(!getMainPosts.result1 || !getMainPosts.result2 || !confirmNewMessage)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {  
            let newMessage = 0; 
            if(confirmNewMessage.length != 0)
                newMessage = 1;
            let deadLineStr = "";
            for(i=0; i<getDeadLinePost.length; i++)
            {
                deadLineStr = deadLineStr + `postIdx = ${getDeadLinePost[i].postIdx} OR `;
            }
            deadLineStr = deadLineStr.substring(0, deadLineStr.length-4);
            if(deadLineStr.length == 0)
            {
                deadLineStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQueryWithDeadline = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ deadLineStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResultWithDeadline = await db.queryParam_None(selectAreaQueryWithDeadline);
            if(!selectAreaResultWithDeadline)
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResultWithDeadline, getDeadLinePost);
            }
            const filteredDeadlinePost = getDeadLinePost.map(post => {
                if(post.postTitle.length > 8)
                    post.postTitle = post.postTitle.substring(0, 6) + "..";
                post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').add(1, 'days').diff(moment(), 'days'));
                return post
            })

            let recentStr = "";
            for(i=0; i<getRecentPost.length; i++)
            {
                recentStr = recentStr + `postIdx = ${getRecentPost[i].postIdx} OR `;
            }
            recentStr = recentStr.substring(0, recentStr.length-4);
            if(recentStr.length == 0)
            {
                recentStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQuery = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ recentStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResultWithRecent = await db.queryParam_None(selectAreaQuery);
            if(!selectAreaResultWithRecent)
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResultWithRecent, getRecentPost);
            }            
            const filteredRecentPost = getRecentPost.map(post => {
                if(post.postTitle.length > 11)
                    post.postTitle = post.postTitle.substring(0, 11) + "..";    
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                isNewMessage : newMessage,
                deadlinePost : filteredDeadlinePost,
                recentPost : filteredRecentPost
            }));
        }
    },
    GetAllPost: async(req, res) => {
        const confirmNewMessage = await noteAccessObject.ConfirmNewMessage(req.decoded.userIdx);
        console.log((parseInt(req.params.pagination)-1)*8)
        const getAllPost = await postAccessObject.GetAllPost((parseInt(req.params.pagination)-1)*8);
        if(!getAllPost || !confirmNewMessage)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {  
            let newMessage = 0; 
            if(confirmNewMessage.length != 0)
                newMessage = 1;
            let allStr = "";
            for(i=0; i<getAllPost.length; i++)
            {
                allStr = allStr + `postIdx = ${getAllPost[i].postIdx} OR `;
            }
            allStr = allStr.substring(0, allStr.length-4);
            if(allStr.length == 0)
            {
                allStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQueryWithAll = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ allStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResultWithAll = await db.queryParam_None(selectAreaQueryWithAll);
            if(!selectAreaResultWithAll)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResultWithAll, getAllPost);
            }
            const filteredAllPost = getAllPost.map(post => {
                if(post.postTitle.length > 12)
                    post.postTitle = post.postTitle.substring(0, 12) + "..";
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                isNewMessage: newMessage,
                allPost : filteredAllPost
            }));
        }
    },
    GetDeadlinePost: async(req, res) => {
        const confirmNewMessage = await noteAccessObject.ConfirmNewMessage(req.decoded.userIdx);
        const getDeadlinePost = await postAccessObject.GetDeadLinePostWithPagination((parseInt(req.params.pagination)-1)*8);
        if(!getDeadlinePost || !confirmNewMessage)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            let deadLineStr = "";
            for(i=0; i<getDeadlinePost.length; i++)
            {
                deadLineStr = deadLineStr + `postIdx = ${getDeadlinePost[i].postIdx} OR `;
            }
            deadLineStr = deadLineStr.substring(0, deadLineStr.length-4);
            if(deadLineStr.length == 0)
            {
                deadLineStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQueryWithDeadline = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ deadLineStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResultWithDeadline = await db.queryParam_None(selectAreaQueryWithDeadline);
            if(!selectAreaResultWithDeadline)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResultWithDeadline, getDeadlinePost);
            }
            let newMessage = 0; 
            if(confirmNewMessage.length != 0)
                newMessage = 1;
            const filteredDeadlinePost = getDeadlinePost.map(post => {
                if(post.postTitle.length > 12)
                    post.postTitle = post.postTitle.substring(0, 12) + "..";
                post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').add(1, 'days').diff(moment(), 'days'));
                return post
            })
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                isNewMessage: newMessage,
                deadlinePost : filteredDeadlinePost
            }));
        }
    },
    GetPostDetail: async(req, res) => {
        const postIdx = req.params.postIdx;
        const confirmNewMessage = await noteAccessObject.ConfirmNewMessage(req.decoded.userIdx);
        const getDetailPost = await postAccessObject.GetDetailPost(postIdx);
        const getUserAndImages = await postAccessObject.GetUserAndImages(postIdx);
        if(!getDetailPost || !getUserAndImages || !confirmNewMessage)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else if(getDetailPost.length ==0 || getUserAndImages.length == 0)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NO_X('게시물')));
        }
        else
        {
            const selectAreaQueryWithDetail = `SELECT areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE postIdx = ? AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResultWithDetail = await db.queryParam_Arr(selectAreaQueryWithDetail ,getDetailPost[0].postIdx);
            if(!selectAreaResultWithDetail)
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                let areaArray = [];
                for(j=0; j<selectAreaResultWithDetail.length ;j++)
                {
                    areaArray.push(selectAreaResultWithDetail[j].areaName);
                }
                getDetailPost[0].areaName = areaArray;
            }

            const selectAgeQueryWithDetail = `SELECT ageName FROM postAgeCategory
            AS pac JOIN ageCategory AS ac WHERE postIdx = ? AND pac.ageCategoryIdx = ac.ageCategoryIdx
            `
            const selectAgeResultWithDetail = await db.queryParam_Arr(selectAgeQueryWithDetail ,getDetailPost[0].postIdx);
            if(!selectAgeResultWithDetail)
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                let ageArray = [];
                for(j=0; j<selectAgeResultWithDetail.length ;j++)
                {
                    ageArray.push(selectAgeResultWithDetail[j].ageName);
                }
                getDetailPost[0].ageName = ageArray;
            }

            const selectClothQueryWithDetail = `SELECT clothName FROM postClothCategory
            AS pac JOIN clothCategory AS ac WHERE postIdx = ? AND pac.clothCategoryIdx = ac.clothCategoryIdx
            `
            const selectClothResultWithDetail = await db.queryParam_Arr(selectClothQueryWithDetail ,getDetailPost[0].postIdx);
            if(!selectClothResultWithDetail)
                res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                let clothArray = [];
                for(j=0; j<selectClothResultWithDetail.length ;j++)
                {
                    clothArray.push(selectClothResultWithDetail[j].clothName);
                }
                getDetailPost[0].clothName = clothArray;
            }


            let newMessage = 0; 
            if(confirmNewMessage.length != 0)
                newMessage = 1;
            const filteredDetailPost = getDetailPost.map(post => {
                post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').add(1, 'days').diff(moment(), 'days'));
                return post
            })
            let images = [] 
            for(i=0; i<getUserAndImages.length; i++)
                images.push(getUserAndImages[i].postImage)
            const ResData = filteredDetailPost[0];
            ResData.nickname = getUserAndImages[0].nickname;
            ResData.userIdx = getUserAndImages[0].userIdx;
            ResData.profileImage =  getUserAndImages[0].profileImage;
            ResData.rating = ratingFilter(getUserAndImages[0].rating);
            if(req.decoded.userIdx == getUserAndImages[0].userIdx)
                ResData.isSender = 1;
            else
                ResData.isSender = 0;
            ResData.postImages = images;
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                isNewMessage: newMessage,
                detailPost : ResData
            }));
        }
    },
    GetFilteredAllPost: async(req, res) => {
        const area = req.body.area;
        const age = req.body.age;
        const cloth = req.body.cloth;
        const confirmNewMessage = await noteAccessObject.ConfirmNewMessage(req.decoded.userIdx);
        if(!area || !age || !cloth)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        let getFilteredPost = await postAccessObject.GetFilteredAllPost(area, age, cloth, (parseInt(req.params.pagination)-1)*8);
        if(!getFilteredPost || !confirmNewMessage)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            let allStr = "";
            for(i=0; i<getFilteredPost.length; i++)
            {
                allStr = allStr + `postIdx = ${getFilteredPost[i].postIdx} OR `;
            }
            allStr = allStr.substring(0, allStr.length-4);
            if(allStr.length == 0)
            {
                allStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQueryWithFilter = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ allStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResultWithFilter = await db.queryParam_None(selectAreaQueryWithFilter);
            if(!selectAreaResultWithFilter)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResultWithFilter, getFilteredPost);
                let newMessage = 0; 
                if(confirmNewMessage.length != 0)
                    newMessage = 1;
                getFilteredPost = getFilteredPost.map(post => {
                    if(post.postTitle.length > 12)
                        post.postTitle = post.postTitle.substring(0, 12) + "..";
                    return post
                })
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
                {
                    isNewMessage: newMessage,
                    filteredAllPost : getFilteredPost
                }));
            }
        }
    },
    GetFilteredDeadlinePost: async(req, res) => {
        const area = req.body.area;
        const age = req.body.age;
        const cloth = req.body.cloth;
        const confirmNewMessage = await noteAccessObject.ConfirmNewMessage(req.decoded.userIdx);
        if(!area || !age || !cloth)
        {
            res.status(200).send(resForm.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
        }
        let getFilteredPost = await postAccessObject.GetFilteredDeadlinePost(area, age, cloth, (parseInt(req.params.pagination)-1)*8);
        if(!getFilteredPost || !confirmNewMessage)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            let deadLineStr = "";
            for(i=0; i<getFilteredPost.length; i++)
            {
                deadLineStr = deadLineStr + `postIdx = ${getFilteredPost[i].postIdx} OR `;
            }
            deadLineStr = deadLineStr.substring(0, deadLineStr.length-4);
            if(deadLineStr.length == 0)
            {
                deadLineStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQueryWithFilter = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ deadLineStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResultWithFilter = await db.queryParam_None(selectAreaQueryWithFilter);
            if(!selectAreaResultWithFilter)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResultWithFilter, getFilteredPost);
                let newMessage = 0; 
                if(confirmNewMessage.length != 0)
                    newMessage = 1;
                getFilteredPost = getFilteredPost.map(post => {
                    if(post.postTitle.length > 12)
                        post.postTitle = post.postTitle.substring(0, 12) + "..";
                    post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').add(1, 'days').diff(moment(), 'days'));
                    return post
                })
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
                {
                    isNewMessage: newMessage,
                    filteredDeadlinePost : getFilteredPost
                }));
            }
        }
    },
    UpdatePost: async(req, res) => {
        // title, content, deadline, areaCategory, ageCategory, clothCategory, postImages
        const title = req.body.title;
        const content = req.body.content;
        let deadline = req.body.deadline;
        const areaCategory = req.body.areaCategory;
        const ageCategory = req.body.ageCategory;
        const clothCategory = req.body.clothCategory;
        const postImages = req.files;
        const postIdx = req.params.postIdx;
        updateTransaction = await postAccessObject.UpdatePost(title, content, deadline, areaCategory, ageCategory, clothCategory, postImages, postIdx);
        if (!updateTransaction)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_UPDATED_X('게시물')));
        }
        else
        {
        res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.UPDATED_X('게시물')));
        }
    },
    DeletePost: async(req, res) => {
        const postIdx = req.params.postIdx;
        deleteTransaction = await postAccessObject.DeletePost(postIdx);
        if(!deleteTransaction)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_REMOVED_X('게시물')));
        }
        else
        {
        res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.REMOVED_X('게시물')));
        }
    },
    SelectPostForQRCode: async(req, res) => {
        const userIdx = req.decoded.userIdx;
        selectPost = await postAccessObject.QRCodePost(userIdx);
        if(!selectPost)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            let allStr = "";
            for(i=0; i<selectPost.length; i++)
            {
                allStr = allStr + `postIdx = ${selectPost[i].postIdx} OR `;
            }
            allStr = allStr.substring(0, allStr.length-4);
            if(allStr.length == 0)
            {
                allStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQuery = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ allStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResult = await db.queryParam_None(selectAreaQuery);
            if(!selectAreaResult)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResult, selectPost);
            }
            res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
            {
                allPost : selectPost
            }));
        }
    },
    SearchPost: async(req, res) => {
        const query = req.body.query;
        console.log(query)
        const confirmNewMessage = await noteAccessObject.ConfirmNewMessage(req.decoded.userIdx);
        const getSearchPost = await postAccessObject.GetSearchedPost(query, (parseInt(req.params.pagination)-1)*8);
        if(!getSearchPost || !confirmNewMessage)
        {
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
        }
        else
        {
            let allStr = "";
            for(i=0; i<getSearchPost.length; i++)
            {
                allStr = allStr + `postIdx = ${getSearchPost[i].postIdx} OR `;
            }
            allStr = allStr.substring(0, allStr.length-4);
            if(allStr.length == 0)
            {
                allStr = 'pac.areaCategoryIdx = ac.areaCategoryIdx';
            }
            const selectAreaQueryWithDeadline = `SELECT postIdx, areaName FROM postAreaCategory
            AS pac JOIN areaCategory AS ac WHERE (`+ allStr +`) AND pac.areaCategoryIdx = ac.areaCategoryIdx
            `
            const selectAreaResultWithDeadline = await db.queryParam_None(selectAreaQueryWithDeadline);
            if(!selectAreaResultWithDeadline)
            res.status(200).send(resForm.successFalse(statusCode.DB_ERROR, resMessage.FAIL_READ_X('게시물')));
            else
            {
                matchAreaWithPost(selectAreaResultWithDeadline, getSearchPost);
                let newMessage = 0; 
                if(confirmNewMessage.length != 0)
                    newMessage = 1;
                const filteredDeadlinePost = getSearchPost.map(post => {
                    if(post.postTitle.length > 12)
                        post.postTitle = post.postTitle.substring(0, 12) + "..";
                    post.deadline = 'D-'+ moment.duration(moment(post.deadline, 'YYYY-MM-DD').add(1, 'days').diff(moment(), 'days'));
                    return post
                })
                res.status(200).send(resForm.successTrue(statusCode.OK, resMessage.READ_X('게시물'),
                {
                    isNewMessage: newMessage,
                    allPost : filteredDeadlinePost
                }));
            }
        }
    }
}  