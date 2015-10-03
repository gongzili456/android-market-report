const debug = require('debug')('bz:app:task:index:');

import co from 'co';
import {App} from '../app/models';
import _ from 'lodash';
import init from './init_market_app';

co(function*() {

  let apps = yield App.findAll();

  debug('apps: ', apps.length);

  for (let app of apps) {
    init(app);
  }


});
