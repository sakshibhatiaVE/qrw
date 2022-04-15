// get the Console class
const { Console } = require("console");
// get fs module for creating write streams
const fs = require("fs");

const customLogger = new Console({
  stdout: fs.createWriteStream("./logs/successLogs.txt"),
  stderr: fs.createWriteStream("./logs/errorLogs.txt"),
});

module.exports = customLogger;
