require('babel/register');

const fittime = 'com.rjfittime.app';
const safe = 'com.qihoo360.mobilesafe';

var co = require('co');
var job_360 = require('./market_360_job');
var job_baidu = require('./market_baidu_job');
var job_wandoujia = require('./market_wandoujia_job');
var job_xiaomi = require('./market_xiaomi_job');


var models = require('../app/models');
var App = models.app;
var MarketApp = models.marketApp;



var mapping = {
  1: job_360,
  2: job_baidu,
  4: job_wandoujia,
  5: job_xiaomi
};

co(function*() {


  var apps = yield MarketApp.findAll({
    limit: 100
  });

  console.log("app: ", apps.length);


  for (var app of apps) {
    yield mapping[app.market_id](app).run();
  }


});



