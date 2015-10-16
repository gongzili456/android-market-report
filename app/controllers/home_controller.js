"use strict";

import {App, MarketApp, Market} from '../models';
import config from 'config';
var parse = require('co-body');
import _ from 'lodash';
import assign from 'object-assign';
import request from 'co-request';

var debug = require('debug')('bz:app:controllers:home:');


export default {
  index: function *() {
    let apps = yield this.session.user.getApps({
      where: {
        status: 0
      },
      include: [{
        model: MarketApp,
        include: [Market]
      }]
    });

    debug('apps: ', apps);

    this.body = yield this.render('home/index', {
      apps: apps
    });
  }
}
