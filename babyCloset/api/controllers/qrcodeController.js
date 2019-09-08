const resForm = require('../../modules/utils/rest/responseForm');
const statusCode = require('../../modules/utils/rest/statusCode');
const resMessage = require('../../modules/utils/rest/responseMessage');
const postAccessObject = require('../dataAccessObjects/postAccessObject');
const express = require('express');
const path = require('path'); 
const qrCode = require('qrcode')
const aws = require('aws-sdk');
const fs = require('fs');
const config = require('../../config/awsconfig.json');

const s3 = new aws.S3({
    config
});

module.exports = {
    makeQrcode: async(req, res) => {
        userIdx = 7777;
        qrCode.toFile( path.join(__dirname, `../../public/qrcode/${userIdx}.png`) ,'http://www.naver.com',
        (err, string) => {
        if (err) throw err;
        s3.upload({
            'Bucket':'sopt24server',
            'Key': `${userIdx}.png`,
            'ACL':'public-read',
            'Body':fs.createReadStream(path.join(__dirname, `../../public/qrcode/${userIdx}.png`)),
            'ContentType':'image/png'
        },
        (err, data) => {
            if (err) throw err;
            fs.unlink(path.join(__dirname, `../../public/qrcode/${userIdx}.png`), (err) => {
                if (err) throw err;
            });
        });
})
    }
}