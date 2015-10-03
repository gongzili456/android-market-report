import {MarketApp, sequelize, App} from '../app/models';
import _ from 'lodash';
import request from 'co-request';
import co from 'co';
import wait from 'co-wait';
import limiter from 'co-limiter';
import * as update_info_job from './update_info_job';

const debug = require('debug')('bz:app:task:update_info_task:');

let limit = limiter(10);

let marekt_ids = [1, 2, 4, 5];

function *getApps(page) {
  debug('page: ', page);

  return yield App.findAll({
    limit: 100,
    offset: (page - 1) * 100
  });
}


function *job(apps) {

  for (let app of apps) {
    //co(function*() {
    //  yield limit(update_info_job.start(app));
    //});

    yield wait(200);
    yield update_info_job.start(app);

    console.log(app.name);

  }

}

co(function*() {

  var index = 1;

  while (true) {
    let apps = yield getApps(index);

    index++;

    debug("app length: ", apps.length);

    if (apps.length === 0) {
      break;
    }

    yield job(apps);
  }


  // next fill it

  //let apps_length = yield App.count();
  //let market_app_length = yield MarketApp.count();
  //
  //debug('app_length: ', apps_length, '  market_app_length: ', market_app_length);
  //
  //if (apps_length * marekt_ids.length === market_app_length) {
  //  return;
  //}
  //
  //var repeat = 3;
  //
  //while (repeat > 0) {
  //  let incomplete = yield sequelize.query(`select app_id, count(*) as count from market_app group by app_id`, {type: sequelize.QueryTypes.SELECT});
  //
  //  if (incomplete.length <= 0) {
  //    repeat = 0;
  //    break;
  //  }
  //
  //  let market_apps = yield MarketApp.findAll({
  //    where: {
  //      app_id: _.map(incomplete, 'app_id')
  //    }
  //  });
  //
  //  debug('market_apps: ', market_apps);
  //
  //}

}).catch(function (err) {
  console.error('error: ', err);
});
