/*
 * File Name: utilities/scheduler.js
 * Created By: Nitin Kumar
 */
import mongoose from "mongoose";
import USERMODEL from "../collections/user";
import VIDEOMODEL from "../collections/video-management";
import NOTIFICATIONMODEL from "../collections/notifications";
import NOTIFICATIONCRONSTATUSMODEL from "../collections/notification-cron-status";
import { sendMultipleFCM } from "../utilities/fcm";
import { getVideoDetails } from "../services/youtubeDataApi";
var AWS = require("aws-sdk");
import config from "config";
var _ = require("lodash");
const logger = require("./logger").getLogger("notification");
const customLogger = require("./custom-logger");
var _ = require("lodash");

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
/*************************************
    *    *    *    *    *    *
    ┬    ┬    ┬    ┬    ┬    ┬
    │    │    │    │    │    |
    │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
    │    │    │    │    └───── month (1 - 12)
    │    │    │    └────────── day of month (1 - 31)
    │    │    └─────────────── hour (0 - 23)               9 
    │    └──────────────────── minute (0 - 59)             0
    └───────────────────────── second (0 - 59, OPTIONAL)   0

********************************************************/
// '0 0 * * *' (*/1 * * * * (per minute))run command at 12 o'clock midnight everyday----//
// 'this will run everyday at 9 Am');
const cronJob = require("cron").CronJob;

/*
 * cron job for sending notification regarding video publish
 */

export const setVideoPublishReminder = async () => {
  new cronJob(
    "0 */30 * * * *",
    async function () {
      try {
        customLogger.log("cron starts from try block at " + new Date());

        // get notification cron status from DB
        const cronStatus = await NOTIFICATIONCRONSTATUSMODEL.findOne({
          notificationType: "TransportTV",
        });

        customLogger.log("cron status is " + cronStatus.status);

        if (cronStatus && cronStatus.status === 0) {
          customLogger.log("cron starts running at " + new Date());

          // variables
          var url;

          const dateToMatch = new Date();
          dateToMatch.setUTCSeconds(0);
          dateToMatch.setUTCMilliseconds(0);

          // date time 30 min behind
          var dateTimeUptoFetchVideos = new Date(
            new Date().getTime() - 30 * 60 * 1000
          );

          customLogger.log(
            "videos to be fetched having publish time between " +
              dateTimeUptoFetchVideos +
              " to " +
              dateToMatch
          );

          // getting all videos whose publish date is less than current time
          let queryCond = {
            is_deleted: false,
            $and: [
              { videoPublishDate: { $gte: dateTimeUptoFetchVideos } },
              { videoPublishDate: { $lte: dateToMatch } },
            ],
            isPublished: false,
            isPushNotificationAllowed: true,
          };

          let allVideos = await VIDEOMODEL.find(queryCond, {
            title: 1,
            categoryId: 1,
            image: 1,
            addedBy: 1,
            youtubeLink: 1,
            vimeoLink: 1,
          }).populate("categoryId", "name slug");

          customLogger.log(
            "length of the video to be published is " + allVideos.length
          );

          //get all the users having device notification token
          let usersData = await USERMODEL.find({
            status: true,
            is_deleted: false,
            role: 3,
            "device_details.device_notification_token": {
              $exists: true,
              $ne: "",
            },
          }).select("device_details _id");

          customLogger.log("total users length " + usersData.length);

          if (allVideos.length) {
            // update cron status
            const updateCronStatus = await NOTIFICATIONCRONSTATUSMODEL.findOneAndUpdate(
              { notificationType: "TransportTV" },
              {
                $set: {
                  status: 1, // running
                },
              },
              { new: true }
            );

            customLogger.log(
              "cron status updated from completed to running at " + new Date()
            );

            // looping over all videos to send notificaitons
            for (const video of allVideos) {
              customLogger.log(
                "notiification sending process started for video titled " +
                  video.title +
                  "at " +
                  new Date()
              );

              // convert image url to s3 url
              if (video.image && video.image != "" && video.image != null) {
                url = await replace_url(video.image);
                video.image = url;
              } else {
                video.image = "";
              }

              // updating publish flag
              let updatePublishStatus = await VIDEOMODEL.findOneAndUpdate(
                { _id: mongoose.Types.ObjectId(video._id) },
                {
                  $set: {
                    isPublished: true,
                  },
                }
              );

              if (usersData.length) {
                let userTokens = [];
                let videoNotif = [];
                usersData.forEach(async (element) => {
                  if (
                    element.device_details &&
                    element.device_details.device_notification_token &&
                    element.device_details.device_notification_token != ""
                  ) {
                    userTokens.push(
                      element.device_details.device_notification_token
                    );
                    //save notification in db
                    let notificationData = {
                      videoId: mongoose.Types.ObjectId(video._id),
                      message: `New video uploaded. ${video.categoryId.name}`,
                      fromUserId: mongoose.Types.ObjectId(video.addedBy),
                      toUserId: mongoose.Types.ObjectId(element._id),
                      notificationType: "TransportTV",
                    };
                    videoNotif.push(notificationData);
                  }
                });
                const notifData = await videoNotification(userTokens, video);
                const savedNotif = await NOTIFICATIONMODEL.insertMany(
                  videoNotif
                );

                // updating youtube data dynamically
                // youtubeStatisticsData = await getYoutubeData(video.youtubeLink);
              }
            }

            const updateStaus = await NOTIFICATIONCRONSTATUSMODEL.findOneAndUpdate(
              { notificationType: "TransportTV" },
              {
                $set: {
                  status: 0, // completed
                },
              },
              { upsert: true, new: true }
            );

            customLogger.log(
              "notiification sending process completed at " + new Date()
            );
          }
        }
      } catch (error) {
        customLogger.error("Error" + error);
      }
    },
    () => {
      customLogger.log("completed");
    }
  ).start();
};

async function videoNotification(userTokens, video) {
  customLogger.log(
    "total user token from video notification function " + userTokens.length
  );

  let title_lang = {
    en: "Transport TV",
    hi: "ट्रांसपोर्ट टीवी",
    pu: "ਟਰਾਂਸਪੋਰਟ ਟੀਵੀ",
  };

  let datatosend = {
    title_lang: title_lang,
    message: video.title,
    videoId: video._id,
    vimeoLink: video.vimeoLink,
    image: video.image,
    notificationType: "TransportTV",
  };

  const chunks = _.chunk(userTokens, 100);
  const promises = _.map(chunks, (e) => {
    return sendMultipleFCM(e, datatosend);
  });
  return Promise.all(promises);
}

async function replace_url(msg) {
  let originalurl = msg.split("/").pop();
  var params = {
    Bucket: BUCKET_NAME,
    Key: originalurl,
  };

  var paramsToFetch = {
    Bucket: BUCKET_NAME,
    Key: originalurl,
    Expires: 604800,
  };

  const headCode = await s3
    .headObject(params)
    .promise()
    .then(
      () => true,
      (err) => {
        if (err) {
          return false;
        }
      }
    );

  if (!headCode) {
    paramsToFetch = {
      Bucket: BUCKET_NAME_IMAGE + "/videothumbnails",
      Key: originalurl,
      Expires: 604800,
    };
  }

  const url = await s3.getSignedUrl("getObject", paramsToFetch);
  return url;
}

async function getYoutubeData(link, mainVideo) {
  if (link == "" || link == null || link == undefined) {
    return {};
  }
  let video_id = link.split("v=")[1];
  const ampersandPosition = video_id.indexOf("&");
  if (ampersandPosition != -1) {
    video_id = video_id.substring(0, ampersandPosition);
  }
  customLogger.log("actual video id is " + mainVideo._id);
  const youtubeData = await getVideoDetails(video_id);
  if (
    youtubeData &&
    youtubeData.data &&
    youtubeData.data.items &&
    youtubeData.data.items.length
  ) {
    return youtubeData.data.items[0].statistics;
  } else {
    return {};
  }
}

/*
 * cron job for deleting old notification collection data
 */
export const setNotificationDelete = async () => {
  new cronJob(
    "00 30 09 * * *",
    async function () {
      try {
        customLogger.log("deleting notification cron run at " + new Date());

        // setting 10 days prev date
        var dateToDeleteRecords = new Date(
          new Date().getTime() - 10 * 24 * 60 * 60 * 1000
        );

        dateToDeleteRecords.setUTCHours(0);
        dateToDeleteRecords.setUTCMinutes(0);
        dateToDeleteRecords.setUTCMilliseconds(0);
        dateToDeleteRecords.setUTCMilliseconds(0);

        customLogger.log("date untill to get records " + dateToDeleteRecords);

        // getting all notification of type TransportTV having date less than the data to match
        let query = {
          $or: [
            {
              is_deleted: false,
              createdAt: { $lt: dateToDeleteRecords },
              notificationType: "TransportTV",
            },
            {
              isRead: true,
              notificationType: "TransportTV",
            },
          ],
        };

        // total count
        const count = await NOTIFICATIONMODEL.countDocuments(query);
        customLogger.log("Notification count " + count);

        // deleting records
        if (count > 0) {
          const deleteRecords = await NOTIFICATIONMODEL.deleteMany(query);
          customLogger.log(
            "Notification deleted count " + deleteRecords.deletedCount
          );
        }
      } catch (error) {
        customLogger.error("error:" + error);
      }
    },
    () => {
      customLogger.log("completed");
    }
  ).start();
};

/*
 * cron job for updating YT data
 */
export const updateYTdata = async () => {
  new cronJob(
    "00 30 07 * * *",
    async function () {
      try {
        console.log("called YT data API ");
        customLogger.log("update YT stats cron runs at " + new Date());

        // getting all videos that are published
        let query = {
          is_deleted: false,
          isPublished: true,
          youtubeLink: { $ne: "" },
        };

        const allVideos = await VIDEOMODEL.find(query);

        customLogger.log(
          "videos length to update YT stats is " + allVideos.length
        );

        if (allVideos.length) {
          for (const video of allVideos) {
            let youtubeStatisticsData;
            // getting YT latest data
            if (video.youtubeLink !== "") {
              youtubeStatisticsData = await getYoutubeData(
                video.youtubeLink,
                video
              );
              // if youtubeStatistics is empty object
              if (
                youtubeStatisticsData && // 👈 null and undefined check
                Object.keys(youtubeStatisticsData).length === 0 &&
                Object.getPrototypeOf(youtubeStatisticsData) ===
                  Object.prototype
              ) {
                youtubeStatisticsData = {
                  likeCount: video.likes,
                  viewCount: video.views,
                  dislikeCount: video.dislikes,
                };
              }
              // updating publish flag and youtube data in DB
              let updateYTStats = await VIDEOMODEL.findOneAndUpdate(
                { _id: mongoose.Types.ObjectId(video._id) },
                {
                  $set: {
                    likes: youtubeStatisticsData.likeCount,
                    views: youtubeStatisticsData.viewCount,
                    dislikes: youtubeStatisticsData.dislikeCount,
                  },
                }
              );
            }
          }
        }
      } catch (error) {
        customLogger.log("error:" + error);
      }
    },
    () => {
      customLogger.log("completed");
    }
  ).start();
};
