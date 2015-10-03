const debug = require('debug')('bz:app:task:update_market_app:index:');

import co from 'co';
import _ from 'lodash';
import wait from 'co-wait';
import limiter from 'co-limiter';


import {MarketApp, Download, Comment} from '../../app/models';

var requireDir = require('require-dir');

var tasks = requireDir('./', {recurse: true});

var limit = limiter(2);

function *job(page) {

  let app = yield MarketApp.find({
    limit: 1,
    offset: page - 1
  });

  debug('app: ', JSON.stringify(app, null, '  '));

  if (app.market_id === 1) {

    debug('=========================   1   ==============');
    yield tasks.market360.start(app);

  } else if (app.market_id === 2) {

    debug('=========================   2   ==============');
    yield tasks.baidu.start(app);

  } else if (app.market_id === 4) {

    debug('=========================   4   ==============');
    yield tasks.wandoujia.start(app);

  } else if (app.market_id === 5) {

    debug('=========================   5   ==============');
    yield tasks.xiaomi.start(app);

  }
}


co(function*() {

  let count = yield MarketApp.count();

  var index = 0;

  while (index < count) {
    yield limit(job(index + 1));
    index++;
  }

});


