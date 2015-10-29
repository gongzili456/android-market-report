var request = require('request');
var co = require('co');
var fs = require('fs');
var limiter = require('co-limiter');


var job = function *(i) {
  yield request('http://m.shouji.360tpcdn.com/151021/b24fd93efd3eee1ba29fdd27d5835bc6/com.rjfittime.app_20002997.apk').pipe(fs.createWriteStream('/Users/liuguili/Desktop/tmp/app_' + i + '.apk'));
}

co(function*(){
  var limit = limiter(2);

  for (var i = 0; i < 10; i++) {
    co(function *() {
      yield limit(job(i));
    });
  }
});
