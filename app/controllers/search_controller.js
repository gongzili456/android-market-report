"use strict";

import {User} from '../models';
import config from 'config';
var parse = require('co-body');
import redis from '../../lib/redis';
import crypto from 'crypto';
import _ from 'lodash';
import cheerio from 'cheerio';

import request from 'co-request';

var debug = require('debug')('bz:app:controllers:search:');

export function *toSearch() {

  this.body = yield this.render('search/index');
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
    xiaomi(app_name),
    sougou(app_name),
    huawei(app_name)
  ];

  let list = _.flatten(_.compact(result));

  let group = _.groupBy(list, (res) => {
    return res.apk_name;
  });


  let keys = Object.keys(group);

  var final_result = [];

  for (let key of keys) {

    let values = group[key];

    let obj = {
      icon: values[0].icon,
      name: values[0].name,
      apk_name: values[0].apk_name,
      market_names: [],
      data_list: []
    };

    _.map(values, (v) => {
      obj.data_list.push({
        market_id: v.market_id,
        data: v.data
      });

      obj.market_names.push(v.market_name);
    });

    final_result.push(obj);
  }

  this.body = {
    status: 200,
    data: final_result
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
    } catch (err) {
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
    return a.detail !== undefined && a.detail.app_detail.title.toLowerCase().indexOf(name.toLowerCase()) >= 0;
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


function *sougou(name) {

  let url = `http://mobile.zhushou.sogou.com/android/search.html?groupid=mix&limit=20&start=0&keyword=${encodeURIComponent(name)}`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.mix.list;


  let filter = _.filter(data, (a) => {
    return decodeURIComponent(a.name).toLowerCase().indexOf(name.toLowerCase()) >= 0;
  });

  if (filter.length <= 0) {
    return;
  }

  return _.map(filter, (app) => {
    return {
      icon: decodeURIComponent(app.icon),
      name: decodeURIComponent(app.name),
      apk_name: app.packagename,
      market_name: '搜狗手机助手',
      market_id: 12,
      data: app
    }
  });
}

function *huawei(name) {
  let url = `http://appstore.huawei.com/search/${encodeURIComponent(name)}`;

  debug('url: ', url);

  let result = yield request(url);

  let body = result.body;

  let $ = cheerio.load(body);

  let list_app_div = $('div.unit-main div.list-game-app');

  debug('list div: ', list_app_div.length);

  var apps = [];


  $('div.unit-main div.list-game-app').each(function (i, ele) {
    if (!$(this).hasClass('nofloat')) {
      return;
    }

    let icon = $(this).find('.game-info-ico img.app-ico').attr('lazyload');

    let down = $(this).find('a.down').attr('onclick');

    //zhytools.downloadApp('C10322406','Viadeo','search_dl','26','社交通讯','http://122.11.38.214/dl/appdl/application/apk/64/6401392fcae2403ea1c723e8bdd79ea0/com.viadeo.android.1508071107.apk?sign=portal@portal1444040375864&source=portalsite','3.3.5');
    let sub_str = down.substring(down.indexOf('(') + 1, down.indexOf(')'));

    let sub_arr = sub_str.split(',');

    let apk_name_pre = sub_arr[5];
    let apk_name_pp = apk_name_pre.substring(apk_name_pre.lastIndexOf('/') + 1, apk_name_pre.indexOf('.apk'));
    let apk_name = apk_name_pp.substring(0, apk_name_pp.lastIndexOf('.'));
    debug('apk_name: ', apk_name);


    apps.push({
      icon: icon,
      name: sub_arr[1],
      apk_name: apk_name,
      market_id: 9,
      market_name: '华为市场',
      data: {
        id: _.trim(sub_arr[0], '\''),
        version: sub_arr[6]
      }
    })

  });

  return apps;
}
