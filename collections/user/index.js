/*
 * @file: index.js
 * @description: It Contain function layer for user collection.
 * @author: Ranjeet Saini
 */

import mongoose from "mongoose";
import userSchema from "./db-schema";

class UserClass {
  static checkEmail(email) {
    //   var obj = { email }
    return this.findOne({
      $or: [
        { 'email': email },
        { 'secondary_email': email },
      ]
    });
    // return this.findOne(obj);
  }
  static checkPhone(phoneNumber) {
    var obj = { phone }
    return this.findOne(obj);
  }
  static checkToken(token) {
    return this.findOne({ "login_token.token": token }).populate('permissions');
  }
  static saveUser(payload) {
    return this(payload).save();
  }
  static login(email, password) {
    return this.findOne({
      email,
      password,
      is_deleted: false
    });
  }

  static findone(query) {
    return this.findOne(query);
  }
  static findOneByCondition(condition) {
    return this.findOne(condition);
  }

  static findByCondition(condition) {
    return this.find(condition);
  }


  static onLoginDone(userId, loginToken, deviceToken = null, deviceType = 'web') {
    let updateData = {
      $push: { login_token: { token: loginToken, deviceToken: deviceToken, deviceType: deviceType } },
      $set: {
        isFirstLogin:true,
        isLogin: true,
        lastLogin: Date.now(),
        updatedAt: Date.now()
      }
    };
    return this.findByIdAndUpdate(userId, updateData, { new: true });
  }

  static updateUserInfo(userId, payload) {
    const updateData = {
      $set: {
        ...payload,
        updatedAt: Date.now()
      }
    };
    return this.findByIdAndUpdate(userId, updateData, { new: true });
  }
  static updateUser(payload) {
    let updateData = {
      $set: {
        ...payload
      }
    };
    return this.findByIdAndUpdate(payload._id, updateData, { new: true });
  }

  static logout(userId, token) {
    let updateData = {
      $set: {
        device_details: { 
            device_notification_token: "",
            device_type: ""
        },
        updatedAt: Date.now(),
        isLogin: false
      },
      $pull: { login_token: { token } }
    };
    return this.findByIdAndUpdate(userId, updateData);
  }
  static logoutAgent(email, password) {
    console.log("email---->",email,"password====>",password)
    let updateData = {
      $set: {
        updatedAt: Date.now(),
        // login_token:{},
        isLogin: false
      }
    };
    return this.findByIdAndUpdate({ email : email , password : password }, updateData);
  }

  static getExpireDate(month) {
    var dt = new Date();
    return new Date(dt.setMonth(dt.getMonth() + month));
  }

  static setToken(userId, payload = {}) {
    let updateToken = {
      $set: {
        device_details: { 
            device_notification_token: payload.device_notification_token,
            device_type: payload.device_type
          } 
      },
    };

    return this.findByIdAndUpdate(userId, updateToken, { new: true });
  }

  static removeToken(userId) {
    let updateToken = {
      $set: {
        device_details: { 
            device_notification_token: "",
            device_type: ""
          } 
      },
    };

    return this.findByIdAndUpdate(userId, updateToken, { new: true });
  }
}

userSchema.loadClass(UserClass);

export default mongoose.model("User", userSchema);
