require('babel/register');

var search = require('./search');
var models = require('../app/models');
var App = models.app;

var co = require('co');

co(function*() {
  var apps = yield App.findAll();

  console.log('apps: ', apps);

  for (var app of apps) {
    yield search.wandoujia(app);
    yield search.baidu(app);
    yield search.market360(app);
    yield search.xiaomi(app);
  }

});
