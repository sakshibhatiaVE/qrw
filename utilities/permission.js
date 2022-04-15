/*
 * @file: permisson.js
 * @description: It Contain permessions routes.
 * @author: Sanjeev Kumar
 */

/****************** Constants ******************/
  //READ related permisson issue
export const READ_PERMISSION_URL = {
    GET_USER_BY_ID: "/user/get-by-id/:id",
    GET_ALL_USERS : "/user/get-all-users",
    GET_PERMISSONS : "/permissions/get-all"
    
};
//WRITE related permisson issue
export const WRITE_PERMISSION_URL = {
    UPDATE_STATUS : "/user/updateStatus",
    UPDATE_USER : "/user/update-user",
    CHANGE_PERMISSON : "/permissions/change-permission",
    ADD_USER : "/user/add-user"
};
//DELETE related permisson issue
export const DELETE_PERMISSION_URL = {
    DELETE_USER_BY_ID: "/user/delete/:id",
};

/*********************************news Realted permissons******************************************* */
//READ related permisson NEWS 
export const READ_PERMISSION_NEWS_URL = {
    GET_NEWS_BY_ID: "/news/get-by-id/:id",
    GET_ALL_NEWS : "/news/get-all",
};
//WRITE related permisson issue
export const WRITE_PERMISSION_NEWS_URL = {
    UPDATE_STATUS : "/news/updateStatus",
    UPDATE : "/news/update",
    ADD : "/news/add"
};
//DELETE related permisson issue
export const DELETE_PERMISSION_NEWS_URL = {
    DELETE_NEWS_BY_ID: "/news/delete/:id",
};

/*********************************users Realted permissons******************************************* */
//READ related permisson NEWS 
export const READ_PERMISSION_USERS_URL = {
    GET_BY_ID: "/user/get-by-id/:id",
    GET_ALL : "/user/get-all-users",
};
//WRITE related permisson issue
export const WRITE_PERMISSION_USERS_URL = {
    UPDATE_STATUS : "/user/updateStatus",
    UPDATE : "/user/update-user",
    ADD : "/user/add-user"
};
//DELETE related permisson issue
export const DELETE_PERMISSION_USERS_URL = {
    DELETE_BY_ID: "/user/delete/:id",
};