/*
 * @file: index.js
 * @description: It's combine all user routers.
 * @author: Sakshi Bhatia
 */

import login from "./login";
import addUser from "./add-user";
// import login from "./otp-login";

export default [
  addUser,
  login,
];
