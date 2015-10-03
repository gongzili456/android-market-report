import co from 'co';
import request from 'co-request';
import _ from 'lodash';
//import redis from '../lib/redis';

const debug = require('debug')('bz:app:task:crawler:');

let prefix_comment = 'tmp_comment_';

export default function *load(url) {

  debug('url: ', url);

  let result = yield request({
    uri: url,
    gzip: true,
    maxSocket:50,
    timeout: 20000
  });

  let body = result.body;

  if (typeof body === 'string') {
    try{
      body = JSON.parse(body);
    }
    catch(ex){
      console.log('JSON parse error');
    }

  }

  return body;
}


//function *storage(id, body) {
//  yield redis.lpush(prefix_comment + id, JSON.stringify(body));
//}
