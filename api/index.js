/*
 * @file: index.js
 * @description: It's combine all routers.
 * @author: Sakshi Bhatia
 */

import user from "./v1/user";


/*********** Combine all Routes ********************/
export default [
  ...user
];
