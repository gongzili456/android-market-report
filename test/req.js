"use strict";

let co = require("co");
let request = require("co-request");

co(function* () {
  let app_name = 'fittime';
  let url = `http://182.118.31.51/api/search/all?q=${app_name}&src=ms_zhushou`;
  let result = yield request(url);
  let response = result;
  let body = result.body;

  console.log("Response: ", response);
  console.log("Body: ", body);
}).catch(function (err) {
  console.err(err);
});
