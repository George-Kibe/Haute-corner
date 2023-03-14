'use strict';

const ServerlessHttp = require("serverless-http");
const app = require("./src/app");
module.exports.hello = ServerlessHttp(app);
