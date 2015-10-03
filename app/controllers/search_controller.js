"use strict";

import {User} from '../models';
import config from 'config';
var parse = require('co-body');
import redis from '../../lib/redis';
import crypto from 'crypto';
import _ from 'lodash';

import request from 'co-request';

var debug = require('debug')('bz:app:controllers:sign:');

export function *toSearch() {

  this.body = yield this.render('');
}

export function *doSearch() {

  let app_name = this.query.q;

  if (!app_name) {
    return this.body = {
      status: 400,
      message: 'q is required.'
    }
  }

  let result = yield [
    market360(app_name),
    baidu(app_name),
    wandoujia(app_name),
    xiaomi(app_name)
  ];

  this.body = {
    status: 200,
    data: result
  };
}


function *market360(name) {
  let url = `http://182.118.31.51/api/search/all?q=${encodeURIComponent(name)}&src=ms_zhushou`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.data.app.data;

  let filter = _.filter(data, (a) => {
    return a.name.toLowerCase().indexOf(name.toLowerCase()) >= 0;
  });

  if (filter.length <= 0) {
    return;
  }

  return _.map(filter, (app) => {
    return {
      icon: app.logo_url,
      name: app.name,
      apk_name: app.apkid,
      market_name: '360手机助手',
      market_id: 1,
      data: app
    }
  });
}

function *baidu(name) {

  let url = `http://m.baidu.com/s?tn=native&st=10a001&word=${encodeURIComponent(name)}&pkname=com.baidu.appsearch&platform_version_id=22&ver=16785345`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.result.data;

  let filter = _.filter(data, (a) => {
    var index = -1;
    try {
      index = a.itemdata.sname.toLowerCase().indexOf(name.toLowerCase()) >= 0;
    } catch(err) {
      console.log('a.sname: ', a.sname, url);
    }
    return index;
  });

  if (filter.length <= 0) {
    return;
  }

  return _.map(filter, (app) => {
    return {
      icon: app.itemdata.icon,
      name: app.itemdata.sname,
      apk_name: app.itemdata.package,
      market_name: '百度手机助手',
      market_id: 2,
      data: app
    }
  });

}

function *wandoujia(name) {
  let url = `http://ias.wandoujia.com/api/v3/search?query=${encodeURIComponent(name)}`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.entity;

  let filter = _.filter(data, (a) => {
    return a.id !== 0 && a.detail.app_detail.title.toLowerCase().indexOf(name.toLowerCase()) >= 0;
  });

  if (filter.length <= 0) {
    return;
  }

  return _.map(filter, (app) => {
    return {
      icon: app.detail.app_detail.icons.px256,
      name: app.detail.app_detail.title,
      apk_name: app.detail.app_detail.package_name,
      market_name: '豌豆荚',
      market_id: 4,
      data: app
    }
  });
}

function *xiaomi(name) {
  let url = `http://app.market.xiaomi.com/apm/search?channel=market_100_1_android&clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&keyword=${encodeURIComponent(name)}&la=zh&marketVersion=147&os=2074855&page=0&sdk=22`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.listApp;

  let filter = _.filter(data, (a) => {
    return a.displayName.toLowerCase().indexOf(name.toLowerCase()) >= 0;
  });

  if (filter.length <= 0) {
    return;
  }

  return _.map(filter, (app) => {
    return {
      icon: 'http://file.market.xiaomi.com/thumbnail/PNG/l62/' + app.icon,
      name: app.displayName,
      apk_name: app.packageName,
      market_name: '小米应用商店',
      market_id: 5,
      data: app
    }
  });
}
