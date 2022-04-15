/*
 * @file: db-schema.js
 * @description: It Contain db schema for user collection.
 * @author: Ranjeet Saini
 */
import validator from "validator";
import mongoose from "mongoose";
const Schema = mongoose.Schema;

var DEVICE_TYPE = {
  ANDROID: "android",
  IOS: "ios",
};

const userSchema = new mongoose.Schema(
  {
    emp_id: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      // unique: true,
      // required: true,
      minlength: 1,
      trim: true,
    },
    permission: [],
    fname_en: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      trim: true,
    },
    lname_en: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    phone_suffix: {
      type: String,
      required: false
    },
    version_code: {
      type: Number,
      required: false
    },
    build_type: {
      type: String,
      required: false
    },
    secondaryPhone: {
      type: String,
      default: "",
    },
    tempPrimaryPhone: {
      type: String,
      required: false,
    },
    tempSecondaryPhone: {
      type: String,
      required: false,
    },
    otp: {
      type: String,
      required: false,
    },
    secondaryOtp: {
      type: String,
      required: false,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    clientId: {
      type: String,
      default: "",
      index: true,
    },
    group: {
      type: String,
      default: "GROUP1",
    },
    domain: {
      type: String,
      default: "",
    },
    isSecondaryMobileVerified: {
      type: Boolean,
      default: false,
    },
    std_code: {
      type: String,
      required: false,
      trim: true,
    },
    gender_en: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
    },
    state: {
      type: String,
      required: false,
      trim: true,
    },
    zipcode: {
      type: String,
      required: false,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    encodedImage: {
      type: String,
      default: "",
    },
    defaultImage: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    vehicleType: [
      {
        type: String,
        default: "",
      },
    ],
    // vehicleType: [String],
    verification_token: {
      type: String,
      default: "",
    },
    role: {
      type: Number,
      required: false,
      enum: [1, 2, 3, 4], // 1->admin , 2->sub-admin, 3->users , 4 ->agent
      default: 3,
      index: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    dob: {
      type: Date,
      required: false,
      trim: true,
    },
    rejectedRequests: [
      {
        customerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: new Date(),
        },
      },
    ],
    login_token: [
      {
        token: {
          type: String,
          required: false,
        },
        createdAt: {
          type: Date,
          default: new Date(),
        },
        deviceToken: {
          type: String,
          default: "", // for testing
        },
        deviceType: {
          type: String,
          default: "web", // ios | android
        },
      },
    ],
    is_deleted: {
      type: Boolean,
      default: false,
    },
    isLogin: {
      type: Boolean,
      default: false,
    },
    isFirstLogin: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: new Date(),
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    isRequestForchat: {
      type: Boolean,
      default: true,
    },
    inhandTickets: {
      type: Number,
      default: 0,
    },
    pendingRequests: {
      type: Number,
      default: 0,
    },
    timezone: {
      type: String,
      required: false,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    queryEmail: {
      type: String,
    },
    queryPhone: {
      type: String,
    },
    contactAddress: {
      type: String,
    },
    device_details: {
      device_notification_token: { type: String },
      device_type: {
        type: String,
        enum: [DEVICE_TYPE.ANDROID, DEVICE_TYPE.IOS],
      },
    },
    lang: {
      type: String,
      default: "en",
    },
    otpSentDate: {
      type: Date,
    },
    commentEmailRecipients: {
      type: String,
    },
    version_name: {
      type: String,
      required: false
    },
  },
  { timestamps: true }
);

export default userSchema;
