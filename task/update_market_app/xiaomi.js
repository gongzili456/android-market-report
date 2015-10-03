const debug = require('debug')('bz:app:task:update_market_app:xiaomi:');

import co from 'co';
import request from 'co-request';
import {MarketApp, Download, Comment} from '../../app/models';
import _ from 'lodash';
import wait from 'co-wait';


export function *start(app) {

  debug('start market xiaomi');

  yield updateInfo(app);

  yield updateComment(app);
  debug('end market xiaomi');

}

function *updateInfo(app) {

  let url = `http://app.market.xiaomi.com/apm/search?channel=market_100_1_android&clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&keyword=${encodeURIComponent(app.app_name)}&la=zh&marketVersion=147&os=2074855&page=0&sdk=22`;

  debug('url: ', url);

  let result = yield request({
    uri: url,
    timeout: 5000,
    gzip: true
  });
  let body = result.body;

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

  yield app.updateAttributes({
    m_app_id: filter[0].id + '',
    current_version: filter[0].versionName,
    current_version_code: filter[0].versionCode + '',
    category_1: filter[0].level1CategoryId + '',
    category_2: filter[0].level2CategoryId + ''
  });

}

function *updateComment(app) {

  var start = 0;
  var flag = true;

  while (flag) {

    let url = `http://app.market.xiaomi.com/apm/comment/list/${app.m_app_id}?clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&la=zh&marketVersion=147&os=2074855&page=${start}&sdk=22`;

    debug('url: ', url);

    let result = yield request({
      uri: url,
      timeout: 5000,
      gzip: true
    });
    let body = result.body;

    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    let data = body.comments;

    debug('comment data: ', _.map(data, 'commentId').join(','));

    if (start === 0) {
      yield app.updateAttributes({
        comment_count: body.commentCount
      });
    }

    if (data.length <= 0) {
      debug('Break: data length <= 0.');
      flag = false;

      return;
    }

    let exist = yield Comment.findAll({
      where: {
        m_id: {
          $in: _.map(data, 'commentId')
        },
        market_app_id: app.id
      }
    });

    let exist_ids = _.map(exist, 'm_id');

    debug('comment exist: ', exist_ids.join(','));

    let xor = _.xor(_.map(data, (d) => {
      return d.commentId + '';
    }), exist_ids);

    debug('comment xor: ', xor.join(','));

    if (xor.length <= 0) {
      debug('Break: xor length <= 0.');
      start++;
      continue;
    }

    let wait = _.filter(data, (d) => {
      return _.indexOf(xor, d.commentId + '') >= 0;
    });

    debug('wait: ', wait.length);

    var jobs = [];

    wait.forEach((d) => {
      jobs.push(Comment.build({
        market_app_id: app.id,
        m_id: d.commentId + '',
        content: d.commentValue + '',
        version: d.versionName,
        score: d.pointValue,
        publish_time: new Date(d.updateTime)
      }).save());
    });

    yield jobs;

    start++;

    yield wait(5000);
  }

}
