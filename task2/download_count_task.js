import {MarketApp, sequelize} from '../app/models';
import _ from 'lodash';
import request from 'co-request';
import co from 'co';
import wait from 'co-wait';
import limiter from 'co-limiter';
import * as download_count_job from './download_count_job';


const debug = require('debug')('bz:app:task:download_count_task:');


let limit = limiter(10);

function *getApps(page) {

  debug('page: ', page);

  return yield MarketApp.findAll({
    limit: 100,
    offset: (page - 1) * 100
  });

}


function *job(apps) {

  for (let app of apps) {
    co(function*() {
      yield limit(download_count_job.start(app));
    });
  }
}

co(function *() {

  var index = 1;

  while (true) {

    let apps = yield getApps(index);
    index++;

    debug('apps length: ', apps.length);

    if (apps.length === 0) {
      break;
    }

    yield job(apps);
  }
}).catch(function (err) {
  console.error('error: ', err);
});
