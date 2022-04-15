/*
 * @file: constants.js
 * @description: It Contain all constants for application.
 * @author: Ranjeet Saini
 */

/****************** Constants ******************/

export const ROLE = {
  ADMIN: 1
};

export const  APPOINTMENTSTATUS = {
  PENDING: 0,
  REJECTED: 2,
  APPROVED: 1,
  CANCELED: 3,
  COMPLETED: 4
};

export const LIMIT = {
  USERS: 10,
  PROJECTS: 10
};

export const DEVICE = {
  IOS: "ios",
  ANDROID: "android",
  WEB:"web"
};

export const NOTIFICATION_CATEGORY = {
  APPOINTMENT: "booking",
};

export const NOTIFICATION_MESSAGE = {
  NEWAPPOINTMENT: "New Appointment",
  APPROVEDAPPOINTMENT: "Appointment Approved",
  REJECTAPPOINTMENT: "Appointment Rejected",
  CANCELAPPOINTMENT: "Appointment Cancelled",
  COMPLETEDAPPOINTMENT: "Appointment Completed",
  VIDEOADDED: "New Video Added",
  COMMENTREPLY: "Reply On Comment",
  USER_TOKENS: 10
};

export const CHAT = {
  REQUEST_AUTO_ASSIGN_TIME: 30,
  TICKET_LIMIT: 500
};
