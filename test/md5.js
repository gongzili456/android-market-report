var crypto = require('crypto');

function hashStr(str) {
  var hasher = crypto.createHash("md5");
  hasher.update(str);
  var hash_pass = hasher.digest("hex");
  return hash_pass;
}


var md5 = hashStr('123456');

console.log('md5: ', md5);
