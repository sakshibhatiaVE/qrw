/*
 * @file: user.js
 * @description: It Contain function layer for user controller.
 * @author: Ranjeet Saini
 */
import mongoose from "mongoose";
import { successAction, failAction } from "../utilities/response";
import * as SERVICE from "../services/user";
import Message from "../utilities/messages";
/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call login service and perform error handling for users
 */
export const login = async (req, res, next) => {
  const payload = req.body;
  try {
    const data = await SERVICE.onUserLogin(payload);
    res.status(200).json(successAction(data, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call verify otp service and perform error handling for users
 */
export const verifyOtp = async (req, res, next) => {
  const payload = req.body;
  try {
    const data = await SERVICE.verifyUserOtp(payload);
    res.status(200).json(successAction(data, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call add user service and perform error handling
 */
export const addUser = async (req, res, next) => {
  let payload = req.body;
  if (req.user.role == "1" || req.user.role == "2") {
    let addedBy = req.user.userId;
    payload = { ...payload, addedBy };
  }
  try {
    const result = await SERVICE.save(payload);
    res.status(200).json(successAction(result, Message.userAdded));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

export const addUserProfile = async (req, res, next) => {
  let userId = req.user.userId;
  let payload = req.body;
  try {
    const result = await SERVICE.saveUserInfo(payload, userId);
    res.status(200).json(successAction(result, Message.userAdded));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call social login service and perform error handling
 */
export const socialLogin = async (req, res, next) => {
  const payload = req.body;

  try {
    const result = await SERVICE.socialReg(payload);
    res.status(200).json(successAction(result, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};
/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call update user service and perform error handling
 */

export const updateUser = async (req, res, next) => {
  try {
    let payload = req.body;
    const data = await SERVICE.update(payload);
    if (data) {
      res.json(successAction(data, Message.update));
    } else {
      res.json(successAction([]));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call get all user service and perform error handling
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const data = await SERVICE.getAllUsers(
      req.query,
      req.user.userId,
      req.user.role
    );
    if (data) {
      res.json(successAction(data, Message.success));
    } else {
      res.json(successAction([]));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call login  service and perform error handling for admin and subamdins
 */
export const adminLogin = async (req, res, next) => {
  const payload = req.body;
  try {
    const data = await SERVICE.onAdminLogin(payload);
    res.status(200).json(successAction(data, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call forget password service and perform error handling
 */
export const forgotPassword = async (req, res, next) => {
  const payload = req.body;
  try {
    const data = await SERVICE.paswordForgot(payload);
    res.json(successAction(data, Message.emailSend));
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call logout service and perform error handling
 */
export const logout = async (req, res, next) => {
  const payload = req.user;
  payload.token = req.query.loginToken;
  try {
    await SERVICE.logoutUser(payload);
    res.status(200).json(successAction(null, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call update user profile service and perform error handling
 */
export const updateProfile = async (req, res, next) => {
  let userId = req.user.userId;
  try {
    const data = await SERVICE.updateProfile(req.body, userId);
    res.status(200).json(successAction(data, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

export const updateAdminProfile = async (req, res, next) => {
  try {
    const data = await SERVICE.updateAdminProfile(req);
    res.status(200).json(successAction(data, Message.update));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call get user profile service and perform error handling
 */
export const getProfile = async (req, res, next) => {
  const payload = req.user;
  try {
    const rest = await SERVICE.getProfile(payload);
    res.status(200).json(successAction(rest, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call check current password service and perform error handling
 */
export const checkCurrentPassword = async (req, res, next) => {
  try {
    const payload = req.body;
    payload["_id"] = req.user.userId;
    const data = await SERVICE.checkCurrentPassword(payload);
    if (data) {
      res.json(successAction(data, Message.success));
    } else {
      res.json(failAction([]));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call change password service and perform error handling
 */
export const changePassword = async (req, res, next) => {
  let payload = req.body;
  let query = { _id: req.user.userId };
  try {
    const data = await SERVICE.changePassword(query, payload);
    res.json(successAction(null, Message.passwordUpdated));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call update status service and perform error handling
 */
export const updateStatus = async (req, res, next) => {
  try {
    const data = await SERVICE.updateStatus(req.body);
    if (data) {
      res.json(successAction(data, Message.success));
    } else {
      res.json(successAction([]));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call remove user service and perform error handling
 */
export const remove = async (req, res, next) => {
  try {
    const data = await SERVICE.remove(req.params);
    if (data) {
      res.json(successAction(data, Message.success));
    } else {
      res.json(successAction([]));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call get user details service and perform error handling
 */

export const getById = async (req, res, next) => {
  try {
    const data = await SERVICE.get(req.params);
    if (data) {
      res.json(successAction(data, Message.success));
    } else {
      res.json(successAction([]));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to call verify email service and perform error handling
 */
export const emailVerify = async (req, res, next) => {
  try {
    const data = await SERVICE.emailVerify(req.body);
    if (data) {
      res.json(successAction(data, Message.success));
    } else {
      res.json(successAction([]));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to count all documents
 */
export const getTotalCount = async (req, res, next) => {
  try {
    const data = await SERVICE.getTotalCount(req.body);
    if (data) {
      res.json(successAction(data, Message.success));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to get contact information
 */
export const getContactInfo = async (req, res, next) => {
  try {
    const data = await SERVICE.getContactInfo();
    if (data) {
      res.json(successAction(data, Message.success));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description - controller to get contact information
 */
export const getRoomByClientId = async (req, res, next) => {
  try {
    const data = await SERVICE.getRoomByClientId(req.body);
    if (data) {
      res.json(successAction(data, Message.success));
    }
  } catch (error) {
    res.json(failAction(error.message));
  }
};

/**
 *
 * @description - controller to call update phone number and send otp api service
 */
 export const updateNumberOTP = async (req, res, next) => {
  const payload = req.body;
  try {
    const data = await MESSAGESERVICE.updateNumberOTP(payload, req.user.userId);
    res.status(200).json(successAction(data, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**
 *
 * @description - controller to call verify updated number otp service and perform error handling for users
 */
 export const updateNumberVerify = async (req, res, next) => {
  const payload = req.body;
  try {
    const data = await SERVICE.updateNumberVerify(payload);
    res.status(200).json(successAction(data, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

export const saveLanguage = async (req, res, next) => {
  try {
    let payload = req.body;
    const data = await SERVICE.saveLanguage(payload);
    res.status(200).json(successAction(data, Message.success));
  } catch (error) {
    res.json(failAction(error.message));
  }
};

