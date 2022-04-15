const path = require("path");
var AWS = require("aws-sdk");
const fs = require("fs");
const ffmpeg = require("ffmpeg");
const imagePath = "./public/images/users";
const logoPath = "./public/images/watermark.png";
const sharp = require("sharp");
const Axios = require("axios");
const mongoose = require("mongoose");
import MessageSchema from "../collections/message";
import config from "config";
const {
  AWS_REGION,
  BUCKET_NAME,
  BUCKET_NAME_IMAGE,
  S3_ACCESSKEY,
  S3_SECRETKEY,
  PUBLIC_THUMBNAIL_IMAGE
} = config.get("app");
console.log(
  AWS_REGION,
  BUCKET_NAME,
  BUCKET_NAME_IMAGE,
  S3_ACCESSKEY,
  S3_SECRETKEY,
  PUBLIC_THUMBNAIL_IMAGE
);
AWS.config.region = AWS_REGION;
const s3 = new AWS.S3({
  accessKeyId: S3_ACCESSKEY,
  secretAccessKey: S3_SECRETKEY,
});
AWS.config.update({
  signatureVersion: "v4",
});

const generateImageRandom = (length = 32) => {
  let data = "",
    keys = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-";

  for (let i = 0; i < length; i++) {
    data += keys.charAt(Math.floor(Math.random() * keys.length));
  }

  return data;
};

module.exports.uploadImageToS3chat = async function (req, res, fileObject) {
  try {
    var bucPath;
    let UPLOADPATH = "./images";
    console.log("fileObject.files===========>", fileObject.files.filename);
    let fileName = fileObject.files.filename.name.split(".").pop();

    const mimetype = fileObject.files.filename.mimetype;

    fileName = Date.now() + generateImageRandom(6) + "." + fileName;
    let path1 = fileName;
    let data = await fileObject.files.filename.mv(path1);

    return new Promise((resolve, reject) => {
      let readLocalFileStream = fs.createReadStream(path1);
      //console.log("fileName.mimetype---->",fileName)

      let s3DestinationFilePath = path.join(fileName);
      console.log("s3DestinationFilePath------------>", s3DestinationFilePath);
      console.log("file object", fileObject);
      console.log("file type", fileObject.body.type);

      if (fileObject.body.imageType == "users") {
        bucPath = BUCKET_NAME_IMAGE + "/clientprofilePics";
      } else {
        bucPath = BUCKET_NAME;
      }

      s3.upload(
        {
          Bucket: bucPath,
          Key: s3DestinationFilePath,
          Body: readLocalFileStream,
        },
        function (err, result) {
          if (err) {
            console.log("err-->", err);
            reject(err.message);
          } else {
            fs.unlinkSync(path1);
            resolve(result.Location);
            console.log("result.Location--->", result.Location);
          }
        }
      );
    }).then(function (res) {
      console.log("res--of s3---------------->", res);
      let originalurl = res.split("/").pop();
      console.log("originalurl--------------->", originalurl);
      const url = s3.getSignedUrl("getObject", {
        Bucket: bucPath,
        Key: originalurl,
        Expires: 60000,
      });
      var type;
      if (mimetype == "image/jpeg" || mimetype == "image/jpg") {
        type = "type";
      }

      return {
        messageToshow: url,
        messageTosave: res,
        type: fileObject.body.type,
        fileName: fileName,
        mimetype: mimetype,
      };
    });
  } catch (error) {
    return error;
  }
};

/* Author : Aditi , Desc: function to decode base64 image*/
const decodeBase64Image = async function (dataString) {
  let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};
  if (matches) {
    if (matches.length !== 3) {
      return new Error("Invalid input string");
    }

    response.type = matches[1];
    response.data = Buffer.from(matches[2], "base64");
  } else {
    response.error = "Invalid image";
  }

  return response;
};

module.exports.uploadImageToS3 = async function (req, res, fileObject) {
  let width = req.body.width ? req.body.width : 1600;
  let height = req.body.height ? req.body.height : 893;

  let UPLOADPATH = "./images"; //constant.uploadPath;

  let randomStr = Math.floor(Math.random() * 446699 + 99);
  let date = new Date();
  let currentDate = date.valueOf();
  let name = randomStr + "-" + currentDate;
  let type = req.body.type;
  let base64FileCode = fileObject;
  let docBuffer = await decodeBase64Image(base64FileCode);

  // console.log(docBuffer);
  if (docBuffer.error == "Invalid image") {
    return {
      message: "invalidImage",
    };
  } else {
    let imageType = docBuffer.type;

    const resizedData = await sharp(docBuffer.data)
      .resize(width, height)
      .toBuffer()
      .then((resizedImageBuffer) => {
        let resizedImageData = resizedImageBuffer.toString("base64");
        let resizedBase64 = `data:${imageType};base64,${resizedImageData}`;

        return resizedBase64;
      })
      .catch((error) => {
        // error handling
        res.send(error);
      });

    const newData = await decodeBase64Image(resizedData);
    let typeArr = new Array();
    typeArr = imageType.split("/");
    let fileExt = typeArr[1];
    let fullFileName = name + "." + fileExt;

    var uploadLocation = "public/images/" + type + "/" + fullFileName;

    const test = fs.writeFile(
      "public/images/" + type + "/" + fullFileName,
      newData.data,
      function (err, result) {
        if (err) {
          console.log("err", err);
        }
      }
    );
    return fullFileName;
  }
};

module.exports.removeImagefromS3 = async function (payload) {
  // var uploadLocation = "public/images/" + payload.type + "/" + payload.image;
  // await fs.unlink(uploadLocation, (err) => {
  //   console.log("err", err);
  // });
  let image = payload.image;
  let lastIndex = image.lastIndexOf("/");
  let s1 = image.substring(0, lastIndex);
  let imageName = image.substring(lastIndex + 1);

  //Delete a file from Space
  var params = {
    Bucket: BUCKET_NAME,
    Key: imageName,
  };

  s3.deleteObject(params, function (err, data) {
    if (!err) {
      console.log(data, "Image Deleted Successfully."); // sucessfull response
    } else {
      console.log(err, "Error in Deleting Image."); // an error ocurred
    }
  });
};

module.exports.uploadImageToS3chatMultiple = async function (req, res, file) {
  try {
    let UPLOADPATH = "./images"; //constant.uploadPath;
    //let pathFile = `${videoPath}`;
    /* Handle multiple file upload */
    let fileName = file.name;

    const mimetype = fileName.mimetype;

    //fileName = fileName.replace(/\s+/g, "-").toLowerCase();
    fileName = Date.now() + generateImageRandom(6) + "-" + fileName;
    let path1 = fileName;
    let data = await file.mv(path1);

    return new Promise((resolve, reject) => {
      let readLocalFileStream = fs.createReadStream(path1);
      //console.log("fileName.mimetype---->",fileName)

      let s3DestinationFilePath = path.join(fileName);
      console.log("s3DestinationFilePath------------>", s3DestinationFilePath);
      s3.upload(
        {
          Bucket: BUCKET_NAME,
          Key: s3DestinationFilePath,
          Body: readLocalFileStream,
        },
        function (err, result) {
          if (err) {
            console.log("err-->", err);
            reject(err.message);
          } else {
            fs.unlinkSync(path1);

            //console.log("result.Location--->",result.Location)
          }
        }
      );
    }).then(function (res) {
      console.log("res--of s3---------------->", res);
      let originalurl = res.split("/").pop();
      console.log("originalurl--------------->", originalurl);
      const url = s3.getSignedUrl("getObject", {
        Bucket: BUCKET_NAME,
        Key: originalurl,
        Expires: 10000,
      });
      resolve({ messageToshow: url, messageTosave: res });
      //return { messageToshow : url , messageTosave : res };
    });
  } catch (error) {
    return error;
  }
};

async function replace_url(msg) {
  let originalurl = msg.split("/").pop();
  const url = await s3.getSignedUrl("getObject", {
    Bucket: BUCKET_NAME,
    Key: originalurl,
    // Expires: 1000,
    Expires: 604800,
  });
  return url;
}

export const checkFileRead = async function (payload) {
  try {
    // getting message data by id
    const msgData = await MessageSchema.findOneByCondition({
      _id: mongoose.Types.ObjectId(payload.id),
    });

    // setting signed s3 url
    let url = await replace_url(msgData.message);
    // getting file from s3 using url
    const response = await Axios({
      url: url,
      method: "GET",
      responseType: "arraybuffer",
      headers: {
        "Content-Type": "application/json",
        Accept: "image/*;application/pdf",
      },
    });
    return response.data;
  } catch (error) {
    console.log("error in axios call");
    return error;
  }
};

export const readImageFromFile = async function (payload) {
  try {
    // setting signed s3 url
    let url = await replace_url(payload.url);
    // getting file from s3 using url
    const response = await Axios({
      url: url,
      method: "GET",
      responseType: "arraybuffer",
      headers: {
        "Content-Type": "application/json",
        Accept: "image/*;application/pdf",
      },
    });
    return response.data;
  } catch (error) {
    console.log("error in axios call");
    return error;
  }
};

module.exports.imgUploadOnS3 = async function (req, res, fileObject) {
  try {
    let fileName = fileObject.files.filename.name.split(".").pop();
    const mimetype = fileObject.files.filename.mimetype;

    fileName = Date.now() + generateImageRandom(6) + "." + fileName;
    let path1 = fileName;
    let data = await fileObject.files.filename.mv(path1);
    let bucketPath;
    return new Promise((resolve, reject) => {
      let readLocalFileStream = fs.createReadStream(path1);

      let s3DestinationFilePath = path.join(fileName);
      console.log("s3DestinationFilePath------------>", s3DestinationFilePath);

      if (fileObject.body.type == "QUOTATION") {
        bucketPath = "/QUOTATION";
      }
      if (fileObject.body.type == "USER") {
        bucketPath = "/clientprofilePics";
      }
      if (fileObject.body.type == "VIDEO") {
        bucketPath = "/videothumbnails";
      }
      s3.upload(
        {
          Bucket: BUCKET_NAME_IMAGE + bucketPath,
          Key: s3DestinationFilePath,
          Body: readLocalFileStream,
        },
        function (err, result) {
          if (err) {
            console.log("err-->", err);
            reject(err.message);
          } else {
            fs.unlinkSync(path1);
            resolve(result.Location);
            console.log("result.Location--->", result.Location);
          }
        }
      );
    }).then(function (res) {
      let originalurl = res.split("/").pop();
      const url = s3.getSignedUrl("getObject", {
        Bucket: BUCKET_NAME_IMAGE + bucketPath,
        Key: originalurl,
        Expires: 60000,
      });
      var type;
      if (mimetype == "image/jpeg" || mimetype == "image/jpg") {
        type = "type";
      }

      return {
        messageToshow: url,
        messageTosave: res,
        type: fileObject.body.type,
        fileName: fileName,
        mimetype: mimetype,
        filePath: BUCKET_NAME_IMAGE + bucketPath,
      };
    });
  } catch (error) {
    return error;
  }
};

module.exports.imgUploadWithRatio = async function (req, res, fileObject) {
  var bucketPath;
  let width = req.body.width ? parseInt(req.body.width) : 1600;
  let height = req.body.height ? parseInt(req.body.height) : 893;
  const mimetype = fileObject.files.files.mimetype;
  let fileName = fileObject.files.files.name.split(".").pop();
  fileName = Date.now() + generateImageRandom(6) + "." + fileName;
  let notification_messageToshow;
  let notification_messageTosave;
  // let public_thumbnail;
  let public_thumbnailImage;
  let notificationImage;
  const resizedData = await sharp(fileObject.files.files.data)
    .resize(width, height)
    .toFile("./public/images/video/" + fileName);
  let filePathName = "./public/images/video/" + fileName;
  let path1 = fileName;

  if (req.body.imageType == "videos") {
    let notification_width = 1024;
    let notification_height = 512;
    const notification_resizedData = await sharp(fileObject.files.files.data)
      .resize(notification_width, notification_height)
      .toFile("./public/images/video/notification" + fileName);

    let notification_filePathName =
      "./public/images/video/notification" + fileName;
    let notification_path1 = "notification_" + fileName;

    const notificationPromise = new Promise((resolve, reject) => {
        const notification_fileContent = fs.readFileSync(
          notification_filePathName
        );
        const params = {
          // Bucket: BUCKET_NAME,
          Bucket: BUCKET_NAME_IMAGE + "/videothumbnails",
          Key: notification_path1,
          Body: notification_fileContent,
        };
        s3.upload(params, function (err, result) {
          if (err) {
            console.log("err-->", err);
            reject(err.message);
          } else {
            fs.unlinkSync(notification_filePathName);
            resolve(result.Location);
          }
        });
    })
    const notification_res = await notificationPromise;
    
    let notification_originalurl = notification_res.split("/").pop();
      let notification_url = s3.getSignedUrl("getObject", {
        // Bucket: BUCKET_NAME,
        Bucket: BUCKET_NAME_IMAGE + "/videothumbnails",
        Key: notification_originalurl,
        Expires: 604800,
      });
      notificationImage = {
        notification_messageToshow : notification_url,
        notification_messageTosave : notification_res
      }

  }


  //code for public image of video thumbnails with compression starts
  if (req.body.imageType == "videos") {
    const public_thumbnail_resizedData = await sharp(fileObject.files.files.data)
      .resize(800)
      .jpeg({ quality: 100 })
      .toFile("./public/images/video/thumbnail" + fileName);

    let public_thumbnail_filePathName =
      "./public/images/video/thumbnail" + fileName;
    let public_thumbnail_path1 = "thumbnail_" + fileName;

    const thumbnailPromise = new Promise((resolve, reject) => {
        const public_thumbnail_fileContent = fs.readFileSync(
          public_thumbnail_filePathName
        );
        const params = {
          Bucket: PUBLIC_THUMBNAIL_IMAGE + "/videothumbnails",
          Key: public_thumbnail_path1,
          Body: public_thumbnail_fileContent
        };
        s3.upload(params, function (err, result) {
          if (err) {
            console.log("err-->", err);
            reject(err.message);
          } else {
            fs.unlinkSync(public_thumbnail_filePathName);
            resolve(result.Location);
          }
        });
    });
    const public_thumbnail_res = await thumbnailPromise;
    public_thumbnailImage = {
      public_thumbnail : public_thumbnail_res
    }
  }

  //code for public image of video thumbnails with compression ends

  const originalImagePromise = new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePathName);

    if (req.body.imageType == "videos") {
      bucketPath = "/videothumbnails";
    }
    if (req.body.imageType == "users") {
      bucketPath = "/clientprofilePics";
    }
    if (req.body.imageType == "ads") {
      bucketPath = "/advertisments";
    }

    const params = {
      Bucket: BUCKET_NAME_IMAGE + bucketPath,
      Key: path1,
      Body: fileContent,
    };
    s3.upload(params, function (err, result) {
      if (err) {
        console.log("err-->", err);
        reject(err.message);
      } else {
        fs.unlinkSync(filePathName);
        resolve(result.Location);
      }
    });
  });
  
  const resp = await originalImagePromise;
  let originalurl = resp.split("/").pop();
    const url = s3.getSignedUrl("getObject", {
      Bucket: BUCKET_NAME_IMAGE + bucketPath,
      Key: originalurl,
      Expires: 604800,
    });
    
    let json = {
      messageToshow: url,
      messageTosave: resp,
      notification_messageToshow: notificationImage.notification_messageToshow,
      notification_messageTosave: notificationImage.notification_messageTosave,
      public_thumbnail: public_thumbnailImage.public_thumbnail,
      fileName: fileName,
      mimetype: mimetype
    };
  
    return json;
};
