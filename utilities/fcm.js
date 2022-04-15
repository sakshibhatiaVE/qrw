import FCM from "fcm-node";
import config from "config";
var _ = require("lodash");
//  send FCM push notifications
export const sendFCM = (data, payload) => {
  const android = config.get("android");
  // FCM Server Key.
  let serverKey = android.apiKey;
  let fcm = new FCM(serverKey);
  let notificationObj = {
    to: data.deviceToken,
    priority: "high",
    data: payload,
  };
  fcm.send(notificationObj, (err, messageId) => {
    if (err) {
      console.log("FCM Error ", err);
    } else {
      console.log("FCM Success ", messageId);
    }
  });
};

//  send FCM push notifications to multiple devices
// export const sendMultipleFCM = async(data,payload) => {
//   const android = config.get('android');
//   // FCM Server Key.
//   let serverKey = android.apiKey;
//   let fcm = new FCM(serverKey);
//   let notificationObj = {
//     to: data,
//     priority: 'high',
//     data:payload
//   };
//   fcm.send(notificationObj, (err, messageId) => {
//     if (err) {
//       console.log('FCM Error ', err);
//     } else {
//       console.log('FCM Success ', messageId);
//     }
//   });
// };

export const sendMultipleFCM = async (data, payload) => {
  try {
    var promise = new Promise((resolve, reject) => {
      var notificationObj = {
        registration_ids: data, // required fill with device token
        data: payload,
        priority: "high",
      };

      const android = config.get("android");
      // FCM Server Key.
      let serverKey = android.apiKey;
      let fcm = new FCM(serverKey);
      fcm.send(notificationObj, function (err, response) {
        if (err) {
          // console.log(
          //   "------error in fcm-------for video Id" + payload.videoId,
          //   err
          // );
          reject(err);
        } else {
          // console.log(
          //   "------success in fcm-------for video Id" + payload.videoId,
          //   response
          // );
          resolve(response);
        }
      });
    });
    return promise.then(
      function (sv) {
        return sv;
      },
      function (em) {}
    );
  } catch (e) {}
};

_.delay(sendMultipleFCM, 10);
