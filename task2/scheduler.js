import {MarketApp, sequelize} from '../app/models';
import _ from 'lodash';
import request from 'co-request';
import co from 'co';
import wait from 'co-wait';
import limiter from 'co-limiter';

const debug = require('debug')('bz:app:task:scheduler:');

let limit = limiter(10);

function *job(page) {

  let apps = yield MarketApp.findAll({
    limit: 100,
    offset: (page - 1) * 100
  });

  if (apps.length <= 0) {
    return;
  }

  return apps;
}

function *splitUrl(app) {

  let urls = [];

  switch (app.market_id) {
    case 1:

    case 2:

  }
}

co(function*() {



});
