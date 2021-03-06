const debug = require('debug')('bz:app:task:update_market_app:download_count:');

import co from 'co';
import load from './crawler';
import {MarketApp, Download, Comment} from '../app/models';
import _ from 'lodash';
import wait from 'co-wait';
import cheerio from 'cheerio';


export function *start(app) {

  debug('1app: ', app.id, app.market_id);

  if (app.market_id === 1) {

    debug('2=========================   1   ==============');
    yield market360(app);

  } else if (app.market_id === 2) {

    debug('2=========================   2   ==============');
    yield baidu(app);

  } else if (app.market_id === 4) {

    debug('2=========================   4   ==============');
    yield wandoujia(app);

  } else if (app.market_id === 9) {

    debug('2=========================   9   ==============');
    yield huawei(app);
  } else if (app.market_id === 12) {

    debug('2=========================   12   ==============');
    yield sougou(app);
  }

  debug('\n\n\n');

}

function *market360(app) {

  let url = `http://123.125.82.206/mintf/getAppInfoByIds?pname=${encodeURIComponent(app.apk_name)}&market_id=360market`;

  let body = yield load(url);

  let data = body.data[0];

  if (!data) {
    return;
  }

  let down = Download.build({
    market_app_id: app.id,
    download_total: data.download_times - 0
  });

  yield down.save();

}

function *baidu(app) {

  let url = `http://m.baidu.com/s?tn=native&st=10a001&word=${encodeURIComponent(app.app_name)}&pkname=com.baidu.appsearch&platform_version_id=22&ver=16785345`;

  let body = yield load(url);

  let data = body.result.data;

  let filter = _.filter(data, (a) => {
    return a.itemdata.package === app.apk_name;
  });

  if (filter.length <= 0) {
    return;
  }

  let down = Download.build({
    market_app_id: app.id,
    download_total: filter[0].itemdata.display_download - 0
  });

  yield down.save();

}


function *wandoujia(app) {
  let url = `http://ias.wandoujia.com/api/v3/search?query=${encodeURIComponent(app.app_name)}`;

  let body = yield load(url);

  let data = body.entity;

  let filter = _.filter(data, (a) => {
    return a.detail !== undefined && a.detail.app_detail.package_name === app.apk_name;
  });

  if (filter.length <= 0) {
    return;
  }

  let res_body = yield load(filter[0].action.url);

  if (typeof res_body === 'string') {
    res_body = JSON.parse(res_body);
  }

  let app_data = res_body.entity[0].detail.appDetail;

  if (!app_data) {
    return;
  }

  let down = Download.build({
    market_app_id: app.id,
    download_total: app_data.downloadCount
  });

  yield down.save();
}

function *huawei(app) {
  let url = `http://appstore.huawei.com:80/app/${app.m_app_id}`;

  let body = yield load(url);

  let $ = cheerio.load(body);

  let down_tag = $('ul.app-info-ul span.sub').text();

  let download_count = down_tag.replace(/[^0-9]/ig, "");

  let down = Download.build({
    market_app_id: app.id,
    download_total: download_count - 0
  });

  yield down.save();
}

function *sougou(app) {

  let url = `http://mobile.zhushou.sogou.com/m/appDetail.html?id=${app.m_app_id}`;

  let body = yield load(url);

  let data = body.ainfo;

  if (app.apk_name !== data.pname) {
    debug('apk_name error: ', app.apk_name, data.pname);
    return;
  }

  let down = Download.build({
    market_app_id: app.id,
    download_total: data.dc - 0
  });

  yield down.save();
}
