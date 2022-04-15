/*
 * @file: response.js
 * @description: It Contain function layer for api response status with data.
 * @author: Ranjeet Saini
 */

export const successAction = (data, message = 'OK') => {
    return ({ status: 200, data, message });
}

export const failAction = (message = 'Fail', status = 400) => {
    return ({ status, data: null, message });
}
export const NoMoreDataToLoad = (message = 'No more data to load', status = 401) => {
    return ({ status, data: null, message });
}