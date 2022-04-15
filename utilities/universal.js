/*
 * @file: universal.js
 * @description: It Contain function layer for all commom function.
 * @author: Ranjeet Saini
 */
import md5 from "md5";
import jwt from "jsonwebtoken";
import config from "config";
import { failAction } from "./response";
import Message from "./messages";
import USERMODEL from "./../collections/user";
// import PERMISSIONMODEL from "./../collections/permission";
// import {
//   READ_PERMISSION_URL,
//   WRITE_PERMISSION_URL,
//   DELETE_PERMISSION_URL,
//   READ_PERMISSION_NEWS_URL,
//   WRITE_PERMISSION_NEWS_URL,
//   DELETE_PERMISSION_NEWS_URL,
//   READ_PERMISSION_USERS_URL,
//   WRITE_PERMISSION_USERS_URL,
//   DELETE_PERMISSION_USERS_URL,
// } from "./permission";

const { jwtAlgo, jwtKey } = config.get("app");
const YOUTUBEDATAAPI = "AIzaSyAei5QvpxnO-50SW1rD4Kq10BsaV3S9rBs";
const axios = require("axios");

export const getTimeStamp = () => {
  return Date.now();
};

// password encryption.
export const encryptpassword = (password) => {
  return md5(password);
};
// Generate random strings.
export const generateRandom = (length = 32, alphanumeric = true) => {
  let data = "",
    keys = "";

  if (alphanumeric) {
    keys =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@!#$%^&*";
  } else {
    keys = "0123456789";
  }

  for (let i = 0; i < length; i++) {
    data += keys.charAt(Math.floor(Math.random() * keys.length));
  }
  return data;
};

// Genrate image random name
export const generateImageRandom = (length = 32) => {
  let data = "",
    keys = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-";
  for (let i = 0; i < length; i++) {
    data += keys.charAt(Math.floor(Math.random() * keys.length));
  }
  return data;
};

/*********** Generate JWT token *************/
export const generateToken = (data) =>
  jwt.sign(data, jwtKey, { algorithm: jwtAlgo, expiresIn: "90d" });
/*********** Decode JWT token *************/
export const decodeToken = (token) => jwt.verify(token, jwtKey);

/*********** Verify token *************/
export const checkTokenAdmin = async (req, res, next) => {
  const token = req.headers["authorization"];
  // console.log("req----.>",token)
  let decoded = {};
  try {
    decoded = jwt.verify(token, jwtKey);
  } catch (err) {
    return res.status(401).json(failAction(Message.tokenExpired, 401));
  }
  const user = await USERMODEL.checkToken(token);
  if (user) {
    req.user = { ...decoded, token };
    next();
  } else {
    res.status(401).json(failAction(Message.unauthorizedUser, 401));
  }
};
/*********** Verify token *************/
export const checkToken = async (req, res, next) => {
  if (req.headers["authorization"]) {
    const token = req.headers["authorization"];
    let decoded = {};
    try {
      decoded = jwt.verify(token, jwtKey);
    } catch (err) {
      return res.status(401).json(failAction(Message.tokenExpired, 401));
    }
    const user = await USERMODEL.checkToken(token);
    if (
      user &&
      (user.role == 2 || user.role == 3 || user.role == 1 || user.role == 4)
    ) {
      req.user = { ...decoded, token };
      next();
    } else {
      res.status(401).json(failAction(Message.unauthorizedUser, 401));
    }
  } else {
    next();
  }
};
// export const checkSubAdminPermissions = async (req, res, next) => {
//   const token = req.headers["authorization"];

//   let decoded = {};
//   try {
//     decoded = jwt.verify(token, jwtKey);
//   } catch (err) {
//     return res.status(401).json(failAction(Message.tokenExpired, 401));
//   }
//   const user = await USERMODEL.checkToken(token);
//   const permissionData = await PERMISSIONMODEL.find({
//     userId: user.id,
//     key: "subAdmin",
//   });

//   /*permisson logic*/
//   let giveAccess = false;
//   let routePath = req.route.path;
//   if (
//     routePath == READ_PERMISSION_URL.GET_USER_BY_ID ||
//     routePath == READ_PERMISSION_URL.GET_ALL_USERS ||
//     routePath == READ_PERMISSION_URL.GET_PERMISSONS
//   ) {
//     permissionData.map((data) => {
//       console.log("data====>", data["read"]);
//       if (data["read"] == true) {
//         giveAccess = true;
//       }
//     });
//   }
//   if (
//     routePath == WRITE_PERMISSION_URL.UPDATE_STATUS ||
//     routePath == WRITE_PERMISSION_URL.UPDATE_USER ||
//     routePath == WRITE_PERMISSION_URL.CHANGE_PERMISSON ||
//     routePath == WRITE_PERMISSION_URL.ADD_USER
//   ) {
//     permissionData.map((data) => {
//       if (data["write"] == true) {
//         giveAccess = true;
//       }
//     });
//   }
//   if (routePath == DELETE_PERMISSION_URL.DELETE_USER_BY_ID) {
//     permissionData.map((data) => {
//       console.log("delete permisson-- san--->", data["delete"]);
//       if (data["delete"] == true) {
//         giveAccess = true;
//       }
//     });
//   }

//   if (giveAccess) {
//     req.user = { ...decoded, token };
//     next();
//   } else {
//     res.status(401).json(failAction("Permission denied!", 401));
//   }
// };

// export const checkNewsPermissions = async (req, res, next) => {
//   const token = req.headers["authorization"];

//   let decoded = {};
//   try {
//     decoded = jwt.verify(token, jwtKey);
//   } catch (err) {
//     return res.status(401).json(failAction(Message.tokenExpired, 401));
//   }
//   const user = await USERMODEL.checkToken(token);
//   const permissionData = await PERMISSIONMODEL.find({
//     userId: user.id,
//     key: "news",
//   });

//   /*permisson logic*/
//   let giveAccess = false;
//   let routePath = req.route.path;
//   if (
//     routePath == READ_PERMISSION_NEWS_URL.GET_NEWS_BY_ID ||
//     routePath == READ_PERMISSION_NEWS_URL.GET_ALL_NEWS
//   ) {
//     permissionData.map((data) => {
//       console.log("data====>", data["read"]);
//       if (data["read"] == true) {
//         giveAccess = true;
//       }
//     });
//   }
//   if (
//     routePath == WRITE_PERMISSION_NEWS_URL.UPDATE_STATUS ||
//     routePath == WRITE_PERMISSION_NEWS_URL.UPDATE ||
//     routePath == WRITE_PERMISSION_NEWS_URL.ADD
//   ) {
//     permissionData.map((data) => {
//       if (data["write"] == true) {
//         giveAccess = true;
//       }
//     });
//   }
//   if (routePath == DELETE_PERMISSION_NEWS_URL.DELETE_NEWS_BY_ID) {
//     permissionData.map((data) => {
//       if (data["delete"] == true) {
//         giveAccess = true;
//       }
//     });
//   }

//   if (giveAccess) {
//     req.user = { ...decoded, token };
//     next();
//   } else {
//     res.status(401).json(failAction("Permission denied!", 401));
//   }
// };

// export const checkUserPermissions = async (req, res, next) => {
//   const token = req.headers["authorization"];

//   let decoded = {};
//   try {
//     decoded = jwt.verify(token, jwtKey);
//   } catch (err) {
//     return res.status(401).json(failAction(Message.tokenExpired, 401));
//   }
//   const user = await USERMODEL.checkToken(token);
//   const permissionData = await PERMISSIONMODEL.find({
//     userId: user.id,
//     key: "users",
//   });

//   /*permisson logic*/
//   let giveAccess = false;
//   let routePath = req.route.path;
//   if (
//     routePath == READ_PERMISSION_USERS_URL.GET_BY_ID ||
//     routePath == READ_PERMISSION_USERS_URL.GET_ALL
//   ) {
//     permissionData.map((data) => {
//       if (data["read"] == true) {
//         giveAccess = true;
//       }
//     });
//   }
//   if (
//     routePath == WRITE_PERMISSION_USERS_URL.UPDATE_STATUS ||
//     routePath == WRITE_PERMISSION_USERS_URL.UPDATE ||
//     routePath == WRITE_PERMISSION_USERS_URL.ADD
//   ) {
//     permissionData.map((data) => {
//       if (data["write"] == true) {
//         giveAccess = true;
//       }
//     });
//   }
//   if (routePath == DELETE_PERMISSION_USERS_URL.DELETE_BY_ID) {
//     permissionData.map((data) => {
//       if (data["delete"] == true) {
//         giveAccess = true;
//       }
//     });
//   }

//   if (giveAccess) {
//     req.user = { ...decoded, token };
//     next();
//   } else {
//     res.status(401).json(failAction("Permission denied!", 401));
//   }
// };

/*********** Verify all type user token *************/
export const checkTokenCommon = async (req, res, next) => {
  const token = req.headers["authorization"];
  let decoded = {};
  try {
    decoded = jwt.verify(token, jwtKey);
  } catch (err) {
    return res.status(401).json(failAction(Message.tokenExpired, 401));
  }
  const user = await USERMODEL.checkToken(token);
  if (user) {
    req.user = { ...decoded, token };
    next();
  } else {
    res.status(401).json(failAction(Message.unauthorizedUser, 401));
  }
};

/*********** Add youtube likes and dislikes *************/
export const addYoutubeData = async (req, res, next) => {
  if (req.body.youtubeLink) {
    var video_id = req.body.youtubeLink.split("v=")[1];
    var ampersandPosition = video_id.indexOf("&");
    if (ampersandPosition != -1) {
      video_id = video_id.substring(0, ampersandPosition);
    }

    let youtubeData = await axios
      .get(
        `https://content-youtube.googleapis.com/youtube/v3/videos?part=statistics&part=contentDetails&part=id&part=player&part=recordingDetails&part=snippet&part=statistics&part=status&id=${video_id}&key=${YOUTUBEDATAAPI}`
      )
      .then(function (response) {
        if (response.data.items[0] && response.data.items[0].statistics) {
          req.body.likes = response.data.items[0].statistics.likeCount;
          req.body.dislikes = response.data.items[0].statistics.dislikeCount;
          req.body.views = response.data.items[0].statistics.viewCount;
          next();
        } else {
          next();
        }
      })
      .catch(function (error) {
        console.log("err", error);
        return error;
      });
  } else {
    next();
  }
};
