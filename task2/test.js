var co = require('co');
var wait = require('co-wait');
var limiter = require('co-limiter');

var limit = limiter(1);

var job = function *() {
  console.log('Doing something...');
  yield wait(1000);
};

for (var i = 0; i < 10; i++) {
  co(function *() {
    yield limit(job());
  })
}
