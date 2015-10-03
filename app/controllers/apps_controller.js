"use strict";

import {App, MarketApp, Market} from '../models';
import config from 'config';
var parse = require('co-body');
import _ from 'lodash';
import assign from 'object-assign';
import request from 'co-request';

import * as InitTask from '../../task/init_market_app';

var debug = require('debug')('bz:app:controllers:apps:');

debug('initTask: ', InitTask);

export function *appList() {

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

  this.body = yield this.render('apps/index', {
    apps: apps
  });

}

export function *addApp() {

  let attr = yield parse.json(this);

  debug('attr: ', JSON.stringify(attr));

  let user = this.session.user;

  if (!attr.name || !attr.apk_name || !attr.icon || !attr.market_id) {
    return this.body = {
      status: 400,
      message: 'The parameters name, apk_name, icon, market_id is required.'
    }
  }

  let exist = yield App.find({
    where: {
      apk_name: attr.apk_name
    }
  });

  if (!exist) {
    //add app
    exist = App.build({
      user_id: user.id,
      name: attr.name,
      apk_name: attr.apk_name,
      icon: attr.icon
    });

    yield exist.save();
  }

  let market_app = yield MarketApp.find({
    where: {
      app_id: exist.id,
      market_id: attr.market_id
    }
  });

  if (!market_app) {
    let additional = yield additionalParams(attr.data, attr.market_id);

    market_app = MarketApp.build(assign({
      app_id: exist.id,
      apk_name: exist.apk_name,
      app_name: exist.name
    }, additional));

    yield market_app.save();
  }

  debug('market_app: ', market_app);

  yield user.removeApp(exist.id);
  yield user.addApp(exist.id);

  this.body = {
    status: 200,
    data: exist
  }


}


function *additionalParams(data, market_id) {
  var additional = {};

  switch (market_id) {
    case 1:
      additional = yield market360(data);
      break;
    case 2:
      additional = yield baidu(data);
      break;
    case 4:
      additional = yield wandoujia(data);
      break;
    case 5:
      additional = yield xiaomi(data);
      break;
  }

  return assign(additional, {
    market_id: market_id,
  });
}

function *market360(data) {
  return {
    m_app_id: data.id + '',
    current_version: data.version_name,
    current_version_code: data.version_code + '',
    category_1: data.category
  }
}

function *baidu(data) {
  return {
    doc_id: data.itemdata.docid,
    group_id: data.itemdata.groupid,
    package_id: data.itemdata.packageid,
    current_version: data.itemdata.versionname,
    current_version_code: data.itemdata.versioncode
  }
}

function *wandoujia(data) {
  let res = yield request(data.action.url);
  let res_body = res.body;

  if (typeof res_body === 'string') {
    res_body = JSON.parse(res_body);
  }

  let app_data = res_body.entity[0].detail.appDetail;

  if (!app_data) {
    return;
  }

  return {
    m_app_id: app_data.id + '',
    tags: _.map(app_data.tags, 'tag').join(','),
    current_version: data.detail.app_detail.apk[0].version_name,
    current_version_code: data.detail.app_detail.apk[0].version_code + ''
  }
}

function *xiaomi(data) {
  return {
    m_app_id: data.id + '',
    current_version: data.versionName,
    current_version_code: data.versionCode + '',
    category_1: data.level1CategoryId + '',
    category_2: data.level2CategoryId + ''
  }
}

export function *delApp() {
  let id = this.params.id;

  let user = this.session.user;

  let app = yield App.find({
    where: {
      id: id
    }
  });

  if (!app) {
    return this.body = {
      status: 200,
      message: `The app id = ${id} is not found.`
    }
  }

  yield user.removeApp(app.id);

  this.body = {
    status: 200,
    data: app
  }
}
``
