import _ from 'lodash';
import request from './my_request';
import {Download, Score, Version, App, MarketApp, Comment} from '../app/models';



module.exports = {

  xiaomi: function*(app) {

    var base_url = 'http://app.market.xiaomi.com';
    var url = `/apm/search?channel=market_100_1_android&clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&densityScaleFactor=3.0&imei=5c15986252967f1c7fc87d57bd9a0490&keyword=${app.name}&la=zh&marketVersion=147&model=Nexus+5&os=2074855&page=0&ref=suggestion&resolution=1080*1776&sdk=22&session=VjAD4q2xh7ue__TW`;


    var body = yield request.call(this, base_url, url);

    console.log('body: ', body);

    var data = body.listApp;

    var _app = {};
    data.forEach(function (a) {
      if (a.packageName === app.apk_name) {
        _app = a;
      }
    });


    if (!_app) {
      console.log("app not found.");
      return false;
    }

    var insert = MarketApp.build({
      market_id: 5,
      app_id: app.id,
      m_app_id: _app.id + '',
      app_name: app.name,
      apk_name: app.apk_name,
      created_at: new Date()
    });

    yield insert.save();
  },

  market360: function*(app) {

    var now = new Date().valueOf();
    var download_url = `/mintf/getAppInfoByIds?pname=${app.apk_name}&market_id=360market&timestamp=${now}`;
    var download_base_url = 'http://123.125.82.206';

    var body = yield request.call(this, download_base_url, download_url);

    var data = body.data[0];

    console.log('data: ', data);

    var insert = MarketApp.build({
      market_id: 1,
      app_id: app.id,
      m_app_id: data.id + '',
      app_name: app.name,
      apk_name: app.apk_name,
      created_at: new Date()
    });


    yield insert.save();
  },

  baidu: function*(app) {

    var base_url = 'http://m.baidu.com';
    var url = `/s?tn=native&st=10a001&word=${app.name}&native_api=1&from=1009556z&network=WF&country=CN&psize=3&is_support_webp=true&language=zh&platform_version_id=22&ver=16785345&native_api=1&pn=0&f=clientsug`;

    var body = yield request.call(this, base_url, url);

    var data = body.result.data;

    if (!data) {
      console.log('Search nothing.');
      return;
    }

    var itemData = _.filter(data, function (item) {
      return item.itemdata.package === app.apk_name;
    });

    if (!itemData) {
      console.log('Nothing Found.');
      return;
    }

    console.log('ItemData: ', itemData[0]);

    data = itemData[0].itemdata;

    console.log('data: ', data);

    var attr = MarketApp.build({
      market_id: 2,
      app_id: app.id,
      group_id: data.groupid,
      doc_id: data.docid,
      package_id: data.packageid,
      app_name: app.name,
      apk_name: app.apk_name,
      created_at: new Date()
    });

    yield attr.save();
  },

  wandoujia: function*(app) {


    var base_url = 'http://apis.wandoujia.com';
    var url = `/apps/v1/${app.apk_name}?v=5.1.1&udid=4e08a422f00e4f919d6fdfe37fae0abe5b34de54&channel=wandoujia_wap&vc=8900&capacity=3`;

    var body = yield request.call(this, base_url, url);

    var data = body.entity[0];

    console.log('data: ', data);

    var attr = MarketApp.build({
      m_app_id: data.detail.appDetail.id + '',
      market_id: 4,
      app_id: app.id,
      app_name: app.name,
      apk_name: app.apk_name,
      created_at: new Date()
    });

    yield attr.save();
  }
};
