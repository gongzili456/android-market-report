const debug = require('debug')('bz:app:task:update_market_app:update_info_job:');

import co from 'co';
import load from './crawler';
import {MarketApp, Download, Comment} from '../app/models';
import _ from 'lodash';
import wait from 'co-wait';

export function *start(app) {

  //debug('1app: ', app.id, app.name, app.apk_name);

  let m = yield market360(app);
  let b = yield baidu(app);
  let w = yield wandoujia(app);
  let x = yield xiaomi(app);

}


export function *market360(app) {
  let url = `http://182.118.31.51/api/search/all?q=${encodeURIComponent(app.name)}&src=ms_zhushou`;

  let body = yield load(url);

  let data = body.data.app.data;

  let filter = _.find(data, (a) => {
    return a.apkid === app.apk_name;
  });

  if (!filter) {
    return;
  }

  let exist = yield MarketApp.find({
    where: {
      market_id: 1,
      app_id: app.id
    }
  });

  if (exist) {
    yield exist.updateAttributes({
      m_app_id: filter.id + '',
      current_version: filter.version_name,
      current_version_code: filter.version_code + '',
      category_1: filter.category
    });

    return;
  }

  let ma = MarketApp.build({
    app_id: app.id,
    market_id: 1,
    apk_name: app.apk_name,
    app_name: app.name,

    m_app_id: filter.id + '',
    current_version: filter.version_name,
    current_version_code: filter.version_code + '',
    category_1: filter.category
  });

  return yield ma.save();
}

export function *baidu(app) {

  let url = `http://m.baidu.com/s?tn=native&st=10a001&word=${encodeURIComponent(app.name)}&pkname=com.baidu.appsearch&platform_version_id=22&ver=16785345`;


  let body = yield load(url);

  let data = body.result.data;

  let filter = _.find(data, (a) => {
    return a.itemdata.package === app.apk_name;
  });

  if (!filter) {
    return;
  }

  let exist = yield MarketApp.find({
    where: {
      market_id: 2,
      app_id: app.id
    }
  });

  if (exist) {
    yield exist.updateAttributes({
      doc_id: filter.itemdata.docid,
      group_id: filter.itemdata.groupid,
      package_id: filter.itemdata.packageid,
      current_version: filter.itemdata.versionname,
      current_version_code: filter.itemdata.versioncode
    });

    return;
  }

  let ma = MarketApp.build({
    app_id: app.id,
    market_id: 2,
    apk_name: app.apk_name,
    app_name: app.name,
    doc_id: filter.itemdata.docid,
    group_id: filter.itemdata.groupid,
    package_id: filter.itemdata.packageid,
    current_version: filter.itemdata.versionname,
    current_version_code: filter.itemdata.versioncode
  });

  return yield ma.save();

}

export function *wandoujia(app) {
  let url = `http://ias.wandoujia.com/api/v3/search?query=${encodeURIComponent(app.name)}`;

  let body = yield load(url);

  let data = body.entity;

  let filter = _.find(data, (a) => {
    return a.id !== 0 && a.detail.app_detail.package_name === app.apk_name;
  });

  if (!filter) {
    return;
  }

  let res_body = yield load(filter.action.url);

  if (typeof res_body === 'string') {
    res_body = JSON.parse(res_body);
  }

  let app_data = res_body.entity[0].detail.appDetail;

  if (!app_data) {
    return;
  }

  let exist = yield MarketApp.find({
    where: {
      market_id: 4,
      app_id: app.id
    }
  });
  if (exist) {
    yield exist.updateAttributes({
      m_app_id: app_data.id + '',
      tags: _.map(app_data.tags, 'tag').join(','),
      current_version: filter.detail.app_detail.apk[0].version_name,
      current_version_code: filter.detail.app_detail.apk[0].version_code + ''
    });

    return;
  }

  let ma = MarketApp.build({
    app_id: app.id,
    market_id: 4,
    apk_name: app.apk_name,
    app_name: app.name,

    m_app_id: app_data.id + '',
    tags: _.map(app_data.tags, 'tag').join(','),
    current_version: filter.detail.app_detail.apk[0].version_name,
    current_version_code: filter.detail.app_detail.apk[0].version_code + ''
  });

  return yield ma.save();
}

export function *xiaomi(app) {

  let url = `http://app.market.xiaomi.com/apm/search?channel=market_100_1_android&clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&keyword=${encodeURIComponent(app.name)}&la=zh&marketVersion=147&os=2074855&page=0&sdk=22`;

  let body = yield load(url);

  let data = body.listApp;

  let filter = _.find(data, (a) => {
    return a.packageName === app.apk_name;
  });

  yield wait(1000);

  if (!filter) {
    console.log('body not support');
    //console.log(body);
    console.log(app.name);
    return;
  }

  let exist = yield MarketApp.find({
    where: {
      market_id: 5,
      app_id: app.id
    }
  });

  if (exist) {
    yield exist.updateAttributes({
      m_app_id: filter.id + '',
      current_version: filter.versionName,
      current_version_code: filter.versionCode + '',
      category_1: filter.level1CategoryId + '',
      category_2: filter.level2CategoryId + ''
    });

    return;
  }

  let ma = MarketApp.build({
    app_id: app.id,
    market_id: 5,
    apk_name: app.apk_name,
    app_name: app.name,

    m_app_id: filter.id + '',
    current_version: filter.versionName,
    current_version_code: filter.versionCode + '',
    category_1: filter.level1CategoryId + '',
    category_2: filter.level2CategoryId + ''
  });

  return yield ma.save();
}
