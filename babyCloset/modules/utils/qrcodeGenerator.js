const path = require('path'); 
const qrCode = require('qrcode')
const aws = require('aws-sdk');
const fs = require('fs');
const config = require('../../config/awsconfig.json');

const s3 = new aws.S3({
    config
});

module.exports = {
    makeQrcode: (userIdx, postIdx) => {
        const qrInformation = {
            userIdx,
            postIdx
        }
        qrCode.toFile( path.join(__dirname, `../../public/qrcode/${userIdx},${postIdx}.png`) ,`${qrInformation}`,
        (err, string) => {
        if (err) throw err;
        s3.upload({
            'Bucket':'sopt24server',
            'Key': `${userIdx},${postIdx}.png`,
            'ACL':'public-read',
            'Body':fs.createReadStream(path.join(__dirname, `../../public/qrcode/${userIdx},${postIdx}.png`)),
            'ContentType':'image/png'
        },
            (err, data) => {
                if (err) throw err;
                fs.unlink(path.join(__dirname, `../../public/qrcode/$${userIdx},${postIdx}.png`), (err) => {
                if (err) throw err;
                });
            });
        })
    }
}