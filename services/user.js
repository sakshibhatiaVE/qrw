/*
 * @file: USERMODEL.js
 * @description: It Contain function layer for user service.
 * @author: Ranjeet Saini
 */

import mongoose from "mongoose";
import USERMODEL from "../collections/user";
// import USERPERMISSIONMODEL from "../collections/user-permission";
import Message from "../utilities/messages";
import Events from "../utilities/event";
// import VIDEOMODEL from "../collections/video-management";
// import NEWSMODEL from "../collections/news-management";
// import ROOMMODEL from "../collections/room";
// import COMMENTMODEL from "../collections/comments";
// import COMMENTREPLYMODEL from "../collections/comment-reply";
import fs from "fs";
import {
  encryptpassword,
  generateToken,
  generateRandom,
  getTimeStamp,
} from "../utilities/universal";
// import { createContact } from "../utilities/mailchimp";
import * as Mail from "../utilities/mail";
const imagePath = "./public/images/";
// const videoPath = "./public/uploads/";
var AWS = require("aws-sdk");
import config from "config";
const axios = require("axios").default;
var twilio = require("twilio");
const SendOtp = require("sendotp");
const { frontendUrl, SEND_GRID_KEY, logoUrl } = config.get("app");
const {
  AWS_REGION,
  BUCKET_NAME,
  BUCKET_NAME_IMAGE,
  S3_ACCESSKEY,
  S3_SECRETKEY,
} = config.get("app");
AWS.config.region = AWS_REGION;
const s3 = new AWS.S3({
  accessKeyId: S3_ACCESSKEY,
  secretAccessKey: S3_SECRETKEY,
});
AWS.config.update({
  signatureVersion: "v4",
});
import moment from "moment";
const imageToBase64 = require("image-to-base64");
const path = require("path");
/**
 *
 * @param {*} payload
 * @description - save users to db
 */
/********** Save users **********/
export const save = async (payload) => {
  //check if email exist
  payload.email = payload.email.toLowerCase();
  const userExists = await USERMODEL.checkEmail(payload.email);
  if (userExists) throw new Error(Message.emailAlreadyExists);
  const pwd = payload.password;
  payload["password"] = encryptpassword(payload.password);

  if (payload.dob) {
    payload.dob = new Date(payload.dob);
  }
  let saveData = await USERMODEL.saveUser(payload);

  /***************** verificatiopn email ****************/
  const result = await Mail.htmlFromatWithObject({
    pwd: pwd,
    emailTemplate: payload.role === 2 ? "subadmin-account" : "user-account",
    data: saveData,
  });

  const emailData = {
    from: "test@yopmail.com",
    to: saveData.email,
    subject: Mail.subjects.registerRequest,
    html: result.html,
    templateId: payload.role === 2 ? "subadmin-account" : "user-account",
  };

  Mail.SENDEMAIL(emailData, function (err, res) {
    if (err)
      console.log(
        "-----@@----- Error at sending verify mail to user -----@@-----",
        err
      );
    else
      console.log(
        "-----@@----- Response at sending verify mail to user -----@@-----",
        res
      );
  });

  let loginToken = generateToken({
    when: getTimeStamp(),
    lastLogin: saveData.lastLogin,
    userId: saveData._id,
    role: saveData.role,
  });

  let updateData = {
    $push: {
      login_token: { token: loginToken, deviceToken: null, deviceType: "web" },
    },
    $set: {
      isFirstLogin: true,
      isLogin: true,
      lastLogin: Date.now(),
      updatedAt: Date.now(),
    },
  };
  let saveData1 = await USERMODEL.findOneAndUpdate(
    { _id: mongoose.Types.ObjectId(saveData._id) },
    updateData,
    { new: true }
  );
  return {
    _id: saveData1._id,
    email: saveData1.email,
    loginToken: saveData1.login_token[saveData1.login_token.length - 1].token,
    lastLogin: saveData1.lastLogin,
    fname_en: saveData1.fname_en,
    lname_en: saveData1.lname_en,
    role: saveData1.role,
  };
};

/**
 *
 * @param {*} payload
 * @description - add user details
 */
// export const saveUserInfo = async (payload, userId) => {
//   let saveData = await USERMODEL.findOneAndUpdate(
//     { _id: mongoose.Types.ObjectId(userId) },
//     payload
//   );

//   let query = { _id: mongoose.Types.ObjectId(userId), is_deleted: false };
//   let data = await USERMODEL.findOne(query).select(
//     "fname_en lname_en gender_en phone secondaryPhone image isMobileVerified isSecondaryMobileVerified _id vehicleType"
//   );
//   return data;
// };

// /**
//  *
//  * @param {*} payload
//  * @description - update details of user
//  */
// export const update = async (payload) => {
//   if (payload.dob) {
//     payload.dob = new Date(payload.dob);
//   }
//   return await USERMODEL.findOneAndUpdate(
//     { _id: mongoose.Types.ObjectId(payload.id) },
//     payload,
//     { fields: { _id: 1, status: 1 }, new: true }
//   );
// };

// /**
//  *
//  * @param {*} payload
//  * @description - login user
//  */
// // export const onUserLogin = async (payload) => {
// //   payload["phone"] = payload.phone;
// //   const userData = await USERMODEL.findOneByCondition({
// //     phone: payload.phone,
// //     role: 3,
// //   });

// //   var accountId = "ACbf943f02536d3968c1892c3ed5e57ef5";
// //   var authToken = "67e0080999f3cf53eba98a2a26f22863";

// //   var client = new twilio(accountId, authToken);
// //   let otp = Math.floor(1000 + Math.random() * 9000);

// //   let mess = await client.messages
// //     .create({
// //       body: `Your Transport Mall OTP code is ${otp}. Please do not share it with anybody.`,
// //       to: payload.phone, // Text this number
// //       // from: "+18779601161", // From a valid Twilio number
// //       from: "+17816615536",
// //     })
// //     .then((message) => console.log("OTP successfully sent."))
// //     .catch((e) => {
// //       console.error("Got an error:", e.code, e.message, e.status);

// //       if (
// //         e.status == 400 ||
// //         e.status == 404 ||
// //         e.status == 410 ||
// //         e.status == 503 ||
// //         e.status == undefined
// //       ) {
// //         const sendMessg = axios({
// //           method: "get", //you can set what request you want to be
// //           url: "http://api.msg91.com/api/v5/otp",
// //           data: {
// //             otp: otp,
// //           },
// //           params: {
// //             template_id: "60ed8537107c1a689d7fdb37",
// //             mobile: payload.phone,
// //             authkey: "336617Axejr122v60cb51e6P1",
// //           },
// //         })
// //           .then((data) => {
// //             return data.data;
// //           })
// //           .catch((e) => {
// //             console.log("Error: ", e);
// //           });
// //       }
// //     });

// //   payload.otp = otp;
// //   payload.otpSentDate = new Date();
// //   payload.role = 3;
// //   if (!userData) {
// //     // create user
// //     let clientData;
// //     const is_exists = await axios({
// //       method: "get", //you can set what request you want to be
// //       url: INSURANCEAPI + "/appGetClientDetails",
// //       data: {
// //         mobileNo: payload.phone,
// //       },
// //       headers: {
// //         orgcode: ORGCODE,
// //         "api-key": APIKEY,
// //         "Content-Type": "application/json",
// //       },
// //     })
// //       .then((data) => {
// //         clientData = data.data;
// //         console.log("get client data on sendOTP----->", data.data);
// //         return data.data;
// //       })
// //       .catch((e) => {
// //         console.log("Error: ", e);
// //       });

// //     if (is_exists.data == null && is_exists.message == "invalid_data") {
// //       throw new Error("Invalid Data");
// //     }

// //     if (is_exists.data && is_exists.message == "client_exist") {
// //       const addFlag = await axios({
// //         method: "post", //you can set what request you want to be
// //         url: INSURANCEAPI + "/appUpdateClientMobileAppFlag",
// //         data: {
// //           clientId: clientData.data.clientId,
// //         },
// //         headers: {
// //           orgcode: ORGCODE,
// //           "api-key": APIKEY,
// //           "Content-Type": "application/json",
// //         },
// //       })
// //         .then((data) => {
// //           console.log("flag added to clientId if client already exist--->", data.data);
// //         })
// //         .catch((e) => {
// //           console.log("Error in adding client flag if client already exis: ", e);
// //         });
// //     }

// //     const data = await USERMODEL.saveUser({ ...payload });
// //     return {
// //       otp: otp,
// //       phone: payload.phone,
// //       newUser: true,
// //     };
// //   } else {
// //     if (!userData.status) throw new Error(Message.accountDeactiavted);
// //     if (userData.is_deleted == true) throw new Error(Message.accountDeleted);
// //     // login user
// //     const data = await USERMODEL.updateUserInfo(userData._id, payload);
// //     return {
// //       _id: data._id,
// //       otp: data.otp,
// //       phone: data.phone,
// //       role: data.role,
// //       isFirstLogin: data.isFirstLogin,
// //       newUser: false,
// //     };
// //   }
// // };

// /********** Verify OTP **********/
// export const verifyUserOtp = async (payload) => {
//   let currentDate = new Date();
//   const userData = await USERMODEL.findOneByCondition({
//     phone: payload.phone,
//     otp: payload.otp,
//   });
//   if (!userData) throw new Error(Message.inValidOtp);
//   let timeDifference = moment.duration(
//     moment(currentDate).diff(moment(userData.otpSentDate))
//   );
//   timeDifference = timeDifference.asSeconds();
//   if (timeDifference > 180) {
//     throw new Error(Message.otpExpired);
//   }

//   let clientData;
//   let is_exists;
//   let isNewBuild;
//   if (
//     (payload.build_type == null || !payload.build_type) &&
//     (payload.version_code == null || !payload.version_code)
//   ) {
//     isNewBuild = false;
//     let phoneWithoutCountryCode = payload.phone.replace("+91", "");
//     let crmPost = {
//       method: "get", //you can set what request you want to be
//       url: INSURANCEAPI + "/appGetClientDetails",
//       data: {
//         mobileNoDialCode: "91",
//         mobileNo: phoneWithoutCountryCode,
//       },
//       headers: {
//         orgcode: ORGCODE,
//         "api-key": APIKEY,
//         "Content-Type": "application/json",
//       },
//     };
//     console.log("===========crmPost============332", crmPost);
//     is_exists = await axios(crmPost)
//       .then((data) => {
//         clientData = data.data;
//         console.log("get client data on verifyOTP----->", data.data);
//         return data.data;
//       })
//       .catch((e) => {
//         console.log("Error: ", e);
//       });
//   }

//   if (
//     (payload.build_type == "stage" && payload.version_code > 1000) ||
//     (payload.build_type == "qa" && payload.version_code > 1009) ||
//     (payload.build_type == "live" && payload.version_code > 10000)
//   ) {
//     isNewBuild = true;
//     let countryCode = payload.std_code.replace("+", "");
//     let crmpost = {
//       method: "get", //you can set what request you want to be
//       url: INSURANCEAPI + "/appGetClientDetails",
//       data: {
//         mobileNoDialCode: countryCode,
//         mobileNo: payload.phone_suffix,
//       },
//       headers: {
//         orgcode: ORGCODE,
//         "api-key": APIKEY,
//         "Content-Type": "application/json",
//       },
//     };
//     console.log("=========crmData=362", crmpost);
//     is_exists = await axios(crmpost)
//       .then((data) => {
//         clientData = data.data;
//         console.log("get client data on verifyOTP----->", data.data);
//         return data.data;
//       })
//       .catch((e) => {
//         console.log("Error: ", e);
//       });
//   }

//   if (is_exists.data == null && is_exists.message == "invalid_data") {
//     throw new Error("Invalid Data");
//   }

//   if (is_exists.data == null && is_exists.message == "client_not_found") {
//     let clientIdAfterCRM;
//     if (isNewBuild == true) {
//       let countryCode1 = payload.std_code.replace("+", "");
//       let crmData = {
//         method: "post", //you can set what request you want to be
//         url: INSURANCEAPI + "/appCreateClientUsingMobileNo",
//         data: {
//           mobileNoDialCode1: countryCode1,
//           mobileNo1: payload.phone_suffix,
//         },
//         headers: {
//           orgcode: ORGCODE,
//           "api-key": APIKEY,
//           "Content-Type": "application/json",
//         },
//       };
//       console.log("===crmData=========395", crmData);
//       const createClient = await axios(crmData)
//         .then((data) => {
//           console.log("add client data in new build--->", data.data);
//           clientData = data.data;
//           clientIdAfterCRM = clientData.data.clientId;
//           //add flag if client created
//         })
//         .catch((e) => {
//           console.log("Error in creating user: ", e);
//         });
//     }

//     if (isNewBuild == false) {
//       let phoneWithoutCountryCode1 = payload.phone.replace("+91", "");
//       let crmData = {
//         method: "post", //you can set what request you want to be
//         url: INSURANCEAPI + "/appCreateClientUsingMobileNo",
//         data: {
//           mobileNoDialCode1: "91",
//           mobileNo1: phoneWithoutCountryCode1,
//         },
//         headers: {
//           orgcode: ORGCODE,
//           "api-key": APIKEY,
//           "Content-Type": "application/json",
//         },
//       };
//       console.log("=======crmData======423", crmData);
//       const createClient = await axios(crmData)
//         .then((data) => {
//           console.log("add client data in old build--->", data.data);
//           clientData = data.data;
//           clientIdAfterCRM = clientData.data.clientId;
//           //add flag if client created
//         })
//         .catch((e) => {
//           console.log("Error in creating user: ", e);
//         });
//     }
//     if (clientIdAfterCRM) {
//       let crmData = {
//         method: "post", //you can set what request you want to be
//         url: INSURANCEAPI + "/appUpdateClientMobileAppFlag",
//         data: {
//           clientId: clientData.data.clientId,
//         },
//         headers: {
//           orgcode: ORGCODE,
//           "api-key": APIKEY,
//           "Content-Type": "application/json",
//         },
//       };
//       console.log("=======crmData======448", crmData);

//       const addFlag = await axios(crmData)
//         .then((data) => {
//           console.log(
//             "flag added to clientId if new client created--->",
//             data.data
//           );
//         })
//         .catch((e) => {
//           console.log("Error in adding client flag if new client created: ", e);
//         });
//     }
//   }

//   const isVerify = await USERMODEL.updateUserInfo(userData._id, {
//     isMobileVerified: true,
//     clientId: clientData.data.clientId,
//   });

//   if (
//     payload.device_notification_token &&
//     payload.device_notification_token != ""
//   ) {
//     const tokenExists = await USERMODEL.findOne({
//       "device_details.device_notification_token":
//         payload.device_notification_token,
//       phone: { $ne: payload.phone },
//     });
//     if (tokenExists) {
//       const isTokenRemoved = await USERMODEL.removeToken(tokenExists._id);
//     }
//     const isTokenUpdated = await USERMODEL.setToken(userData._id, payload);
//   }

//   const room_data = await ROOMMODEL.findOne({
//     customerId: mongoose.Types.ObjectId(userData._id),
//   });
//   let loginToken = generateToken({
//     when: getTimeStamp(),
//     lastLogin: userData.lastLogin,
//     userId: userData._id,
//     role: userData.role,
//   });

//   userData["imageToShow"] = "";
//   if (
//     userData.image &&
//     userData.image != "" &&
//     userData.image != null &&
//     userData.image != ""
//   ) {
//     let originalurl = userData.image.split("/").pop();
//     let secure_msg = await s3.getSignedUrl("getObject", {
//       Bucket: BUCKET_NAME_IMAGE + "/clientprofilePics",
//       Key: originalurl,
//       Expires: 1000,
//     });
//     userData["imageToShow"] = secure_msg;
//   }
//   const data = await USERMODEL.onLoginDone(userData._id, loginToken);
//   if (isNewBuild == false) {
//     return {
//       _id: data._id,
//       loginToken: data.login_token[data.login_token.length - 1].token,
//       lastLogin: data.lastLogin,
//       otp: userData.otp,
//       phone: userData.phone,
//       isMobileVerified: true,
//       roomData: room_data,
//       clientId: clientData.data.clientId,
//       fname_en: userData.fname_en,
//       lname_en: userData.lname_en,
//       image: userData.image,
//       imageToShow: userData["imageToShow"],
//     };
//   }
//   if (isNewBuild == true) {
//     return {
//       _id: data._id,
//       loginToken: data.login_token[data.login_token.length - 1].token,
//       lastLogin: data.lastLogin,
//       otp: userData.otp,
//       phone: userData.phone,
//       phone_suffix: userData.phone_suffix,
//       std_code: userData.std_code,
//       isMobileVerified: true,
//       roomData: room_data,
//       clientId: clientData.data.clientId,
//       fname_en: userData.fname_en,
//       lname_en: userData.lname_en,
//       image: userData.image,
//       imageToShow: userData["imageToShow"],
//     };
//   }
// };

/**
 *
 * @param {*} payload
 * @description - login user
 */
export const onUserLogin = async (payload) => {
  payload["email"] = payload.email.toLowerCase();
  const userDatachkEmail = await USERMODEL.findOneByCondition({
    email: payload.email,
  });
  if (!userDatachkEmail) throw new Error(Message.notValidEmail);

  const userData = await USERMODEL.findOneByCondition({
    email: payload.email,
    // role: payload.role,
    // password: encryptpassword(payload.password)
    password: payload.password
  });

  if (!userData) throw new Error(Message.notValidPassword);
  
  let loginToken = generateToken({
    when: getTimeStamp(),
    lastLogin: userData.lastLogin,
    userId: userData._id,
    role: userData.role,
  });

  const data = await USERMODEL.onLoginDone(userData._id, loginToken);

  // if (data.image !== null || data.image !== "") {
  //   let url = await replace_url(data.image);
  //   data.image = url;
  // }

  return userData;
};

// /**
//  *
//  * @param {*} payload
//  * @description - update profile details
//  */
// export const updateProfile = async (payload, userId) => {
//   const query = { _id: mongoose.Types.ObjectId(userId) };
//   if (
//     payload.phone &&
//     (payload.phone != "" || payload.phone != "") &&
//     payload.secondaryPhone &&
//     (payload.secondaryPhone != "" || payload.secondaryPhone != "")
//   ) {
//     if (payload.phone == payload.secondaryPhone) {
//       throw new Error("Primary and secondary phone number cannot be same");
//     }
//   }

//   let userData1;
//   let userData2;
//   let userData3;
//   let userData4;
//   if (payload.phone && (payload.phone != "" || payload.phone != "")) {
//     userData1 = await USERMODEL.findOneByCondition({
//       phone: payload.phone,
//       role: 3,
//       _id: { $ne: mongoose.Types.ObjectId(userId) },
//       is_deleted: false,
//       status: true,
//     });

//     userData2 = await USERMODEL.findOneByCondition({
//       secondaryPhone: payload.phone,
//       role: 3,
//       _id: { $ne: mongoose.Types.ObjectId(userId) },
//       is_deleted: false,
//       status: true,
//     });
//   }

//   if (
//     payload.secondaryPhone &&
//     (payload.secondaryPhone != "" || payload.secondaryPhone != "")
//   ) {
//     userData3 = await USERMODEL.findOneByCondition({
//       phone: payload.secondaryPhone,
//       role: 3,
//       _id: { $ne: mongoose.Types.ObjectId(userId) },
//       is_deleted: false,
//       status: true,
//     });

//     userData4 = await USERMODEL.findOneByCondition({
//       secondaryPhone: payload.secondaryPhone,
//       role: 3,
//       _id: { $ne: mongoose.Types.ObjectId(userId) },
//       is_deleted: false,
//       status: true,
//     });
//   }

//   if (userData1 || userData2) {
//     throw new Error(
//       `${payload.phone} is already registered with another client`
//     );
//   }
//   if (userData3 || userData4) {
//     throw new Error(
//       `${payload.secondaryPhone} is already registered with another client`
//     );
//   }

//   let data = payload;

//   let savedata = await USERMODEL.findOneAndUpdate(query, data, { new: true });

//   let vehicle_type = "";
//   if (savedata.vehicleType.length > 0) {
//     vehicle_type = savedata.vehicleType.toString().toUpperCase();
//     vehicle_type = vehicle_type.replace(/\s/g, "");
//   }

//   let gender = "";
//   if (savedata.gender_en && savedata.gender_en != "") {
//     if (savedata.gender_en == "Male" || savedata.gender_en == "male") {
//       gender = "M";
//     }
//     if (savedata.gender_en == "Female" || savedata.gender_en == "female") {
//       gender = "F";
//     }
//     if (savedata.gender_en == "Others" || savedata.gender_en == "others") {
//       gender = "O";
//     }
//   }

//   if (
//     (payload.build_type == null || !payload.build_type) &&
//     (payload.version_code == null || !payload.version_code)
//   ) {
//     let phoneWithoutCountryCode = savedata.phone.replace("+91", "");
//     const updateClient1 = await axios({
//       method: "post", //you can set what request you want to be
//       url: INSURANCEAPI + "/appUpdateClientUsingId",
//       data: {
//         clientId: savedata.clientId,
//         clientName: savedata.fname_en + " " + savedata.lname_en,
//         mobileNo1: phoneWithoutCountryCode,
//         mobileNoDialCode1: "91",
//         mobileNo2: savedata.secondaryPhone,
//         gender: gender,
//         vehicleType: vehicle_type,
//       },
//       headers: {
//         orgcode: ORGCODE,
//         "api-key": APIKEY,
//         "Content-Type": "application/json",
//       },
//     })
//       .then((data) => {
//         console.log("update client data--->", data.data);
//       })
//       .catch((e) => {
//         console.log("Error: ", e);
//       });
//   }

//   if (
//     (payload.build_type == "stage" && payload.version_code > 1000) ||
//     (payload.build_type == "qa" && payload.version_code > 1009) ||
//     (payload.build_type == "live" && payload.version_code > 10000)
//   ) {
//     let countryCode;
//     if (payload.std_code && payload.std_code != "") {
//       countryCode = payload.std_code.replace("+", "");
//     }
//     const updateClient = await axios({
//       method: "post", //you can set what request you want to be
//       url: INSURANCEAPI + "/appUpdateClientUsingId",
//       data: {
//         clientId: savedata.clientId,
//         clientName: savedata.fname_en + " " + savedata.lname_en,
//         mobileNo1: payload.phone_suffix,
//         mobileNoDialCode1: countryCode,
//         mobileNo2: savedata.secondaryPhone,
//         gender: gender,
//         vehicleType: vehicle_type,
//       },
//       headers: {
//         orgcode: ORGCODE,
//         "api-key": APIKEY,
//         "Content-Type": "application/json",
//       },
//     })
//       .then((data) => {
//         console.log("update client data--->", data.data);
//       })
//       .catch((e) => {
//         console.log("Error: ", e);
//       });
//   }

//   return {
//     _id: savedata._id,
//     loginToken: savedata.login_token[savedata.login_token.length - 1].token,
//     fname_en: savedata.fname_en,
//     lname_en: savedata.lname_en,
//     gender_en: savedata.gender_en,
//     phone: savedata.phone,
//     secondaryPhone: savedata.secondaryPhone,
//     isMobileVerified: savedata.isMobileVerified,
//     isSecondaryMobileVerified: savedata.isSecondaryMobileVerified,
//     vehicleType: savedata.vehicleType,
//     image: savedata.image,
//     clientId: savedata.clientId,
//   };
// };

// /**
//  *
//  * @param {*} payload
//  * @description - update admin profile details
//  */
// export const updateAdminProfile = async (payload) => {
//   let userId = payload.user.userId;
//   if (payload.body.userId) {
//     userId = payload.body.userId;
//   }
//   const query = { _id: mongoose.Types.ObjectId(userId) };
//   if (payload.body.type == "img" && payload.body.isUpdateImageVideo) {
//     let userImag = await USERMODEL.findOne(query);
//     if (userImag && userImag.image != "" && userImag.image != undefined) {
//       let splitImage = userImag.image.split("//");

//       let finalImag = splitImage[1].split("/");
//       let pathFile = `${imagePath}`;

//       let path =
//         pathFile + "users/watermark/" + finalImag[finalImag.length - 1];
//       let path2 =
//         pathFile + "users/watermark/350x220/" + finalImag[finalImag.length - 1];
//       if (fs.existsSync(path)) {
//         fs.unlinkSync(path);
//         fs.unlinkSync(path2);
//       }
//     }
//   }

//   let data = payload.body;
//   let savedata = await USERMODEL.findOneAndUpdate(query, data, { new: true });

//   if (savedata.imag !== null || savedata.image !== "") {
//     let url = await replace_url(savedata.image);
//     savedata.image = url;
//   }
//   return savedata;
// };

// /**
//  *
//  * @param {*} payload
//  * @description - forget password function
//  */
// export const paswordForgot = async (payload) => {
//   if (!payload.email) throw new Error(Message.validEmail);
//   payload.email = payload.email.toLowerCase();
//   const userData = await USERMODEL.checkEmail(payload.email);
//   if (!userData) throw new Error(Message.emailNotExists);
//   const randomNumber = generateRandom(8, true);
//   const password = encryptpassword(randomNumber);
//   let saveData = await USERMODEL.findOneAndUpdate(
//     { _id: userData._id },
//     { password: password }
//   );
//   /***************** verificatiopn email ****************/
//   const result = await Mail.htmlFromatWithObject({
//     data: userData,
//     password: randomNumber,
//     emailTemplate: "forgot-password",
//   });

//   const emailData = {
//     to: payload.email,
//     subject: Mail.subjects.forgetPassword,
//     html: result.html,
//     templateId: "forgot-password",
//   };

//   Mail.SENDEMAIL(emailData, function (err, res) {
//     if (err)
//       console.log(
//         "-----@@----- Error at sending verify mail to user -----@@-----",
//         err
//       );
//     else
//       console.log(
//         "-----@@----- Response at sending verify mail to user -----@@-----",
//         res
//       );
//   });
//   return saveData;
// };

/**
 *
 * @param {*} payload
 * @description - get profile data of user
 */

export const getProfile = async (payload) => {
  let matchObj = { _id: mongoose.Types.ObjectId(payload.userId) };

  let queryObj = await USERMODEL.findOne(matchObj, {
    updatedAt: 0,
    login_token: 0,
    createdAt: 0,
    updatedAt: 0,
  });

  let q = await USERCATMODEL.find({
    user_id: mongoose.Types.ObjectId(payload.userId),
  });
  let cat = [];
  q.forEach((ele) => {
    cat.push(ele.category_id);
  });

  let t = await USERPERMISSIONMODEL.find({
    userId: mongoose.Types.ObjectId(payload.userId),
  });
  let perMis = [];
  t.forEach((ele) => {
    perMis.push(ele.permissionId);
  });

  queryObj.category = cat;
  queryObj.permission = perMis;

  if (queryObj.image !== null || queryObj.image !== "") {
    let url = await replace_url(queryObj.image);
    queryObj.image = url;
  }
  return queryObj;
};

// async function replace_url(msg) {
//   let originalurl = msg.split("/").pop();

//   var params = {
//     Bucket: BUCKET_NAME,
//     Key: originalurl,
//   };

//   var paramsToFetch = {
//     Bucket: BUCKET_NAME,
//     Key: originalurl,
//     Expires: 604800,
//   };

//   const headCode = await s3
//     .headObject(params)
//     .promise()
//     .then(
//       () => true,
//       (err) => {
//         if (err) {
//           return false;
//         }
//       }
//     );

//   if (!headCode) {
//     paramsToFetch = {
//       Bucket: BUCKET_NAME_IMAGE + "/clientprofilePics",
//       Key: originalurl,
//       Expires: 604800,
//     };
//   }

//   const url = await s3.getSignedUrl("getObject", paramsToFetch);
//   return url;
// }

// /**
//  *
//  * @param {*} payload
//  * @description - logout user
//  */
// export const logoutUser = async (payload) => {
//   return await USERMODEL.logout(payload.userId, payload.token);
// };

// /**
//  *
//  * @param {*} payload
//  * @description - validate password
//  */
// export const checkCurrentPassword = async (payload) => {
//   let matchObj = {
//     _id: mongoose.Types.ObjectId(payload._id),
//     password: encryptpassword(payload.currentpwd),
//   };
//   const queryObj = User.findOne(matchObj, { _id: 1 });
//   let userData = await queryObj;
//   if (!userData) throw new Error(Message.passwordNotMtchedError);
//   return userData;
// };

// /**
//  *
//  * @param {*} payload
//  * @description - change password function get otp
//  */

// export const changePassword = async (query, payload) => {
//   let matchObj = {
//     _id: query._id,
//     password: encryptpassword(payload.currentpwd),
//   };
//   const userData = await USERMODEL.findOne(matchObj, { _id: 1 });
//   if (!userData) throw new Error(Message.passwordNotMtchedError);
//   let updateData = {
//     password: encryptpassword(payload.password),
//   };
//   return await USERMODEL.findOneAndUpdate(query, updateData);
// };

// /**
//  *
//  * @param {*} payload
//  * @description - get list of users
//  */
// export const getAllUsers = async (payload, userId, Role) => {
//   let sorting = payload.sort == "DESC" ? -1 : 1;
//   let sort = { [payload.sortBy ? payload.sortBy : "createdAt"]: sorting };
//   let limit = payload.count ? JSON.parse(payload.count) : 10;
//   payload.page = payload.page ? payload.page : 1;
//   let skip = JSON.parse((payload.page - 1) * limit);
//   let matchObj = {};
//   if (Role == 1) {
//     matchObj = { is_deleted: false, _id: { $ne: userId } };
//   } else {
//     matchObj = {
//       is_deleted: false,
//       _id: { $ne: userId },
//       addedBy: { $eq: userId },
//     };
//   }

//   if (payload.status) {
//     matchObj = {
//       ...matchObj,
//       status: payload.status,
//     };
//   }
//   if (payload.role) {
//     matchObj = {
//       ...matchObj,
//       role: payload.role,
//     };
//   }
//   if (payload.search) {
//     payload.search = payload.search.toLowerCase();
//     const regex = new RegExp(`${payload["search"]}`, "i");
//     matchObj = {
//       ...matchObj,
//       $or: [
//         { fname_en: { $regex: regex } },
//         { lname_en: { $regex: regex } },
//         { email: { $regex: regex } },
//         { phone: { $regex: regex } },
//       ],
//     };
//   }

//   if (payload.categoryId && payload.categoryId != "") {
//     matchObj = { ...matchObj, category: { $in: [payload.categoryId] } };
//   }

//   let count = await USERMODEL.countDocuments(matchObj);
//   let data = await USERMODEL.find(matchObj, {
//     addedBy: 1,
//     createdAt: 1,
//     email: 1,
//     fname_en: 1,
//     lname_en: 1,
//     gender_en: 1,
//     image: 1,
//     phone: 1,
//     status: 1,
//     role: 1,
//   })
//     .skip(skip)
//     .limit(limit)
//     .sort(sort);

//   return {
//     data: data,
//     total: count,
//   };
// };

// /**
//  *
//  * @param {*} payload
//  * @description - update status of user
//  */
// export const updateStatus = async (payload) => {
//   let adminUser = await USERMODEL.findOne({ role: 1 });
//   let status;
//   let message;

//   if (payload.status == true) {
//     status = "ACTIVE_USER";
//     message = "Your account has been activated by admin";
//   } else {
//     status = "DEACTIVATE_USER";
//     message = "Your account has been de-activated by admin";
//   }
//   let notiObj = {
//     senderId: adminUser._id,
//     receiverId: payload.id,
//     bookingId: null,
//     message: message,
//     title: "User status update",
//     type: status,
//   };
//   Events.emit(status, { id: payload.id, data: notiObj });
//   return await USERMODEL.findOneAndUpdate(
//     { _id: mongoose.Types.ObjectId(payload.id) },
//     payload,
//     { fields: { _id: 1, status: 1 }, new: true }
//   );
// };

// /**
//  *
//  * @param {*} payload
//  * @description - mark user as removed
//  */
// export const remove = async (query) => {
//   return await USERMODEL.findOneAndUpdate(
//     { _id: mongoose.Types.ObjectId(query.id) },
//     { is_deleted: true },
//     { fields: { _id: 1 }, new: true }
//   );
// };

// /**
//  *
//  * @param {*} payload
//  * @description - get  details of specific user
//  */

// export const get = async (payload) => {
//   let query = { _id: mongoose.Types.ObjectId(payload.id), is_deleted: false };

//   let userData = await USERMODEL.findOne(query);
//   let data = {};
//   if (
//     userData.image &&
//     userData.image != "" &&
//     userData.image != null &&
//     userData.image != ""
//   ) {
//     let url = await replace_url(userData.image);
//     userData["imageToShow"] = url;
//     // let originalurl = userData.image.split("/").pop();
//     // let secure_msg = await s3.getSignedUrl("getObject", {
//     //   Bucket: BUCKET_NAME_IMAGE + "/clientprofilePics",
//     //   Key: originalurl,
//     //   Expires: 1000,
//     // });
//     // userData["imageToShow"] = secure_msg;

//     data = {
//       email: userData.email,
//       fname_en: userData.fname_en,
//       lname_en: userData.lname_en,
//       gender_en: userData.gender_en,
//       phone: userData.phone,
//       secondaryPhone: userData.secondaryPhone,
//       image: userData.image,
//       isMobileVerified: userData.isMobileVerified,
//       isSecondaryMobileVerified: userData.isSecondaryMobileVerified,
//       _id: userData._id,
//       vehicleType: userData.vehicleType,
//       clientId: userData.clientId,
//       imageToShow: userData["imageToShow"],
//     };
//   } else {
//     data = {
//       email: userData.email,
//       fname_en: userData.fname_en,
//       lname_en: userData.lname_en,
//       gender_en: userData.gender_en,
//       phone: userData.phone,
//       secondaryPhone: userData.secondaryPhone,
//       image: userData.image,
//       isMobileVerified: userData.isMobileVerified,
//       isSecondaryMobileVerified: userData.isSecondaryMobileVerified,
//       _id: userData._id,
//       vehicleType: userData.vehicleType,
//       clientId: userData.clientId,
//       imageToShow: "",
//     };
//   }
//   return data;
// };

// /**
//  *
//  * @param {*} payload
//  * @description - social registration
//  */
// export const socialReg = async (payload) => {
//   payload.email = payload.email.toLowerCase();
//   var userExists = await USERMODEL.checkEmail(payload.email);
//   if (!userExists) {
//     userExists = await USERMODEL.saveUser({ ...payload });
//   }
//   let loginToken = generateToken({
//     when: getTimeStamp(),
//     role: userExists.role,
//     userId: userExists._id,
//     email: userExists.email,
//     lastLogin: userExists.lastLogin,
//   });
//   const data = await USERMODEL.onLoginDone(userExists._id, loginToken);
//   return {
//     _id: data._id,
//     email: data.email,
//     loginToken: data.login_token[data.login_token.length - 1].token,
//     lastLogin: data.lastLogin,
//     fname_en: data.fname_en,
//     lname_en: data.lname_en,
//     role: data.role,
//     image: data.image,
//     isFirstLogin: data.isFirstLogin,
//   };
// };

// /**
//  *
//  * @param {*} payload
//  * @description - verify email
//  */

// export const emailVerify = async (payload) => {
//   const uD = await USERMODEL.findOne({
//     verification_token: payload.token,
//     secondary_email: payload.email,
//   });
//   if (uD) {
//     const userData = await USERMODEL.update(
//       { _id: uD._id },
//       { verification_token: "", secondary_email: "", email: payload.email },
//       { new: true }
//     );
//     return userData;
//   } else {
//     throw new Error(Message.verifyTokenExpired);
//   }
// };

// /**
//  *
//  * @param {*} payload
//  * @description - get Total Count of documents
//  */

// export const getTotalCount = async (payload) => {
//   let subadmin = await USERMODEL.countDocuments({ role: 2, is_deleted: false });
//   let users = await USERMODEL.countDocuments({ role: 3, is_deleted: false });
//   let videos = await VIDEOMODEL.countDocuments({ is_deleted: false });
//   let news = await NEWSMODEL.countDocuments({ isDeleted: false });
//   let rootComment = await COMMENTMODEL.countDocuments({
//     is_deleted: false,
//   });
//   let commentReplied = await COMMENTREPLYMODEL.countDocuments({
//     is_deleted: false,
//   });
//   return {
//     total_subadmin: subadmin,
//     total_users: users,
//     total_videos: videos,
//     total_news: news,
//     totalComment: rootComment + commentReplied,
//   };
// };

// /**
//  *
//  * @param {*} payload
//  * @description - get admin profile
//  */

// export const getContactInfo = async () => {
//   const res = await USERMODEL.findOne(
//     { role: 1, is_deleted: false },
//     { _id: 0 }
//   ).select("queryEmail queryPhone contactAddress");
//   return res;
// };

// /**
//  *
//  * @param {*} payload
//  * @description - get admin profile
//  */

// export const getRoomByClientId = async (body) => {
//   console.log("bodyy------------>", body.clientId);
//   try {
//     const res = await USERMODEL.findOne(
//       { clientId: body.clientId },
//       { _id: 1, fname_en: 1, lname_en: 1, phone: 1 }
//     ).lean();
//     let roomdata = await ROOMMODEL.findOne({ customerId: res._id }).lean();
//     roomdata.customerData = res;
//     return roomdata;
//   } catch (e) {}
// };

// /**
//  *
//  * @param {*} payload
//  * @description - update phone number and send otp
//  */
// // export const updateNumberOTP = async (payload, userId) => {
// //   let userExist1 = await USERMODEL.findOneByCondition({
// //     phone: payload.phone,
// //     role: 3,
// //     _id: { $ne: mongoose.Types.ObjectId(userId) },
// //     is_deleted: false,
// //     status: true,
// //   });

// //   let userExist2 = await USERMODEL.findOneByCondition({
// //     secondaryPhone: payload.phone,
// //     role: 3,
// //     _id: { $ne: mongoose.Types.ObjectId(userId) },
// //     is_deleted: false,
// //     status: true,
// //   });

// //   if (userExist1 || userExist2) {
// //     throw new Error(Message.alreadyExistStatus("User", "phone number"));
// //   }

// //   const userData = await USERMODEL.findOneByCondition({
// //     _id: mongoose.Types.ObjectId(userId),
// //     role: 3,
// //     is_deleted: false,
// //     status: true,
// //   });
// //   if (!userData) throw new Error(Message.userNotExists);
// //   if (
// //     userData.secondaryPhone == payload.phone &&
// //     userData.isSecondaryMobileVerified == true
// //   ) {
// //     throw new Error("Number already registered as your secondary number");
// //   }
// //   if (userData.phone == payload.phone && userData.isMobileVerified == true) {
// //     throw new Error("Number already registered as your primary number");
// //   }

// //   var accountId = "ACbf943f02536d3968c1892c3ed5e57ef5";
// //   var authToken = "67e0080999f3cf53eba98a2a26f22863";

// //   var client = new twilio(accountId, authToken);
// //   let otp = Math.floor(1000 + Math.random() * 9000);

// //   let mess = await client.messages
// //     .create({
// //       body: `Your Transport Mall OTP code is ${otp}. Please do not share it with anybody.`,
// //       to: payload.phone, // Text this number
// //       // from: "+18779601161", // From a valid Twilio number
// //       from: "+17816615536",
// //     })
// //     .then((message) => console.log("OTP successfully sent."))
// //     .catch((e) => {
// //       console.error("Got an error:", e.code, e.message, e.status);

// //       if (
// //         e.status == 400 ||
// //         e.status == 404 ||
// //         e.status == 410 ||
// //         e.status == 503 ||
// //         e.status == undefined
// //       ) {
// //         const sendMessg = axios({
// //           method: "get", //you can set what request you want to be
// //           url: "http://api.msg91.com/api/v5/otp",
// //           data: {
// //             otp: otp,
// //           },
// //           params: {
// //             template_id: "60ed8537107c1a689d7fdb37",
// //             mobile: payload.phone,
// //             authkey: "336617Axejr122v60cb51e6P1",
// //           },
// //         })
// //           .then((data) => {
// //             return data.data;
// //           })
// //           .catch((e) => {
// //             console.log("Error: ", e);
// //           });
// //       }
// //     });
// //   let dataToSave = {};
// //   if (payload.isPrimary) {
// //     dataToSave = {
// //       otp: otp,
// //       otpSentDate: new Date(),
// //       phone: payload.phone,
// //       isMobileVerified: false,
// //     };
// //   } else {
// //     dataToSave = {
// //       otp: otp,
// //       otpSentDate: new Date(),
// //       secondaryPhone: payload.phone,
// //       isSecondaryMobileVerified: false,
// //     };
// //   }

// //   const data = await USERMODEL.updateUserInfo(userData._id, dataToSave);
// //   if (payload.isPrimary) {
// //     return {
// //       _id: data._id,
// //       otp: data.otp,
// //       phone: data.phone,
// //       isPrimary: true,
// //     };
// //   } else {
// //     return {
// //       _id: data._id,
// //       otp: data.otp,
// //       secondaryPhone: data.secondaryPhone,
// //       isPrimary: false,
// //     };
// //   }
// // };

// /********** Verify updated number OTP **********/
// export const updateNumberVerify = async (payload) => {
//   let currentDate = new Date();
//   let userData;
//   if (payload.isPrimary) {
//     userData = await USERMODEL.findOneByCondition({
//       tempPrimaryPhone: payload.phone,
//       otp: payload.otp,
//     });
//   } else {
//     userData = await USERMODEL.findOneByCondition({
//       tempSecondaryPhone: payload.phone,
//       otp: payload.otp,
//     });
//   }

//   if (!userData) throw new Error(Message.inValidOtp);

//   let timeDifference = moment.duration(
//     moment(currentDate).diff(moment(userData.otpSentDate))
//   );
//   timeDifference = timeDifference.asSeconds();
//   if (timeDifference > 180) {
//     throw new Error(Message.otpExpired);
//   }
//   let updatedData;
//   if (payload.isPrimary) {
//     updatedData = await USERMODEL.updateUserInfo(userData._id, {
//       isMobileVerified: true,
//       tempPrimaryPhone: "",
//       phone: payload.phone,
//     });
//     return {
//       _id: userData._id,
//       otp: userData.otp,
//       phone: payload.phone,
//       isMobileVerified: updatedData.isMobileVerified,
//       isSecondaryMobileVerified: updatedData.isSecondaryMobileVerified,
//     };
//   } else {
//     updatedData = await USERMODEL.updateUserInfo(userData._id, {
//       isSecondaryMobileVerified: true,
//       tempSecondaryPhone: "",
//       secondaryPhone: payload.phone,
//     });
//     return {
//       _id: userData._id,
//       otp: userData.otp,
//       secondaryPhone: payload.secondaryPhone,
//       isMobileVerified: updatedData.isMobileVerified,
//       isSecondaryMobileVerified: updatedData.isSecondaryMobileVerified,
//     };
//   }
// };

// /********** Save language selected by a user **********/
// export const saveLanguage = async (payload) => {
//   const saveLang = await USERMODEL.updateUserInfo(
//     mongoose.Types.ObjectId(payload.id),
//     {
//       lang: payload.lang,
//     }
//   );
//   if (
//     payload.device_notification_token &&
//     payload.device_notification_token != ""
//   ) {
//     const tokenExists = await USERMODEL.findOne({
//       "device_details.device_notification_token":
//         payload.device_notification_token,
//       _id: { $ne: mongoose.Types.ObjectId(payload.id) },
//     });
//     if (tokenExists) {
//       const isTokenRemoved = await USERMODEL.removeToken(tokenExists._id);
//     }
//     const isTokenUpdated = await USERMODEL.setToken(
//       mongoose.Types.ObjectId(payload.id),
//       payload
//     );
//   }
//   return saveLang;
// };
