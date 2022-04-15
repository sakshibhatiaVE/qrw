/*
 * @file: index.js
 * @description: It Contain db setup function.
 * @author: Ranjeet Saini
 */

import mongoose from "mongoose";
import config from "config";
// const { auth, name, host, username, password, port ,databaseUrl} = config.get('db');
const { auth, name, host, username, password, port } = config.get("db");
const databaseUrl = auth
  ? `mongodb+srv://${username}:${password}@${host}/${name}?retryWrites=true&w=majority`
  : `mongodb://${host}/${name}`;
// Mongose setup with server

mongoose.connect(databaseUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

export const connection = () => {
  mongoose.connection.on("connected", function () {
    console.log("Mongoose connected! ");
  });
};
