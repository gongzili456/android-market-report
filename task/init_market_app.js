const debug = require('debug')('bz:app:task:init_market_app:');

import co from 'co';
import request from 'co-request';
import {MarketApp} from '../app/models';
import _ from 'lodash';

export function start(app) {
  debug('init market app task start.');
  co(function*() {
    debug('init market app task started.');

    yield baidu(app);
    yield wandoujia(app);
    yield xiaomi(app);
    yield market360(app);

  });
}

function *market360(app) {
  let url = `http://182.118.31.51/api/search/all?q=${encodeURIComponent(app.name)}&src=ms_zhushou`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.data.app.data;

  debug('data: ', data);

  let filter = _.filter(data, (a) => {
    return a.apkid === app.apk_name;
  });

  debug('filter: ', filter);

  if (filter.length <= 0) {
    return;
  }

  let ma = MarketApp.build({
    app_id: app.id,
    market_id: 1,
    apk_name: app.apk_name,
    app_name: app.name,

    m_app_id: filter[0].id + '',
    current_version: filter[0].version_name,
    current_version_code: filter[0].version_code + '',
    category_1: filter[0].category
  });

  yield ma.save();
}

function *baidu(app) {

  let url = `http://m.baidu.com/s?tn=native&st=10a001&word=${encodeURIComponent(app.name)}&pkname=com.baidu.appsearch&platform_version_id=22&ver=16785345`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  debug('body: ', body);

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.result.data;

  debug('data: ', data);

  let filter = _.filter(data, (a) => {
    return a.itemdata.package === app.apk_name;
  });

  debug('filter: ', filter, filter.length);

  if (filter.length <= 0) {
    return;
  }

  let ma = MarketApp.build({
    app_id: app.id,
    market_id: 2,
    apk_name: app.apk_name,
    app_name: app.name,
    doc_id: filter[0].itemdata.docid,
    group_id: filter[0].itemdata.groupid,
    package_id: filter[0].itemdata.packageid,
    current_version: filter[0].itemdata.versionname,
    current_version_code: filter[0].itemdata.versioncode
  });

  yield ma.save();

}

function *wandoujia(app) {
  let url = `http://ias.wandoujia.com/api/v3/search?query=${encodeURIComponent(app.name)}`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  debug('body: ', body);

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.entity;

  debug('data: ', data);

  let filter = _.filter(data, (a) => {
    return a.id !== 0 && a.detail.app_detail.package_name === app.apk_name;
  });

  debug('filter: ', filter);

  if (filter.length <= 0) {
    return;
  }

  let res = yield request(filter[0].action.url);
  let res_body = res.body;

  debug('res_body: ', res_body);

  if (typeof res_body === 'string') {
    res_body = JSON.parse(res_body);
  }

  let app_data = res_body.entity[0].detail.appDetail;

  debug('app_data: ', app_data);

  if (!app_data) {
    return;
  }

  let ma = MarketApp.build({
    app_id: app.id,
    market_id: 4,
    apk_name: app.apk_name,
    app_name: app.name,

    m_app_id: app_data.id + '',
    tags: _.map(app_data.tags, 'tag').join(','),
    current_version: filter[0].detail.app_detail.apk[0].version_name,
    current_version_code: filter[0].detail.app_detail.apk[0].version_code + ''
  });

  yield ma.save();
}

function *xiaomi(app) {
  let url = `http://app.market.xiaomi.com/apm/search?channel=market_100_1_android&clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&keyword=${encodeURIComponent(app.name)}&la=zh&marketVersion=147&os=2074855&page=0&sdk=22`;

  debug('url: ', url);

  let result = yield request(url);
  let body = result.body;

  debug('body: ', body);

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.listApp;

  debug('data: ', data);

  let filter = _.filter(data, (a) => {
    return a.packageName === app.apk_name;
  });

  debug('filter: ', filter);

  if (filter.length <= 0) {
    return;
  }

  let ma = MarketApp.build({
    app_id: app.id,
    market_id: 5,
    apk_name: app.apk_name,
    app_name: app.name,

    m_app_id: filter[0].id + '',
    current_version: filter[0].versionName,
    current_version_code: filter[0].versionCode + '',
    category_1: filter[0].level1CategoryId + '',
    category_2: filter[0].level2CategoryId + ''
  });

  yield ma.save();
}
