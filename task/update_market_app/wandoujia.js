const debug = require('debug')('bz:app:task:update_market_app:wandoujia:');

import co from 'co';
import request from 'co-request';
import {MarketApp, Download, Comment} from '../../app/models';
import _ from 'lodash';
import wait from 'co-wait';


export function *start(app) {

  debug('start market wandoujia');

  yield updateInfo(app);

  yield updateComment(app);
  debug('end market wandoujia');

}

function *updateInfo(app) {
  let url = `http://ias.wandoujia.com/api/v3/search?query=${encodeURIComponent(app.app_name)}`;

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

  let data = body.entity;

  debug('data: ', data);

  let filter = _.filter(data, (a) => {
    return a.id !== 0 && a.detail.app_detail.package_name === app.apk_name;
  });

  debug('filter: ', filter);

  if (filter.length <= 0) {
    return;
  }

  let res = yield request({
    uri: filter[0].action.url,
    timeout: 5000,
    gzip: true
  });
  let res_body = res.body;

  if (typeof res_body === 'string') {
    res_body = JSON.parse(res_body);
  }

  let app_data = res_body.entity[0].detail.appDetail;

  debug('app_data: ', app_data);

  if (!app_data) {
    return;
  }

  yield app.updateAttributes({
    m_app_id: app_data.apk[0].id + '',
    tags: _.map(app_data.tags, 'tag').join(','),
    current_version: app_data.apk[0].versionName,
    current_version_code: app_data.apk[0].versionCode + ''
  });

  let down = Download.build({
    market_app_id: app.id,
    download_total: app_data.downloadCount
  });

  yield down.save();
}


function *updateComment(app) {

  var start = 0;
  var flag = true;

  while (flag) {

    let url = `http://comment.wandoujia.com/comment/comment!getCommentSummary.action?pageNum=${start}&pageSize=50&target=${app.apk_name}`;

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

    debug('comment data: ', _.map(data, 'id').join(','));

    if (start === 0) {
      yield app.updateAttributes({
        comment_count: body.count
      });
    }

    if (data.length < 50) {
      debug('Break: data length <= 0.');
      flag = false;
    }

    let exist = yield Comment.findAll({
      where: {
        m_id: {
          $in: _.map(data, 'id')
        },
        market_app_id: app.id
      }
    });

    let exist_ids = _.map(exist, 'm_id');

    debug('comment exist: ', exist_ids.join(','));

    let xor = _.xor(_.map(data, (d) => {
      return d.id + '';
    }), exist_ids);

    debug('comment xor: ', xor.join(','));

    if (xor.length <= 0) {
      debug('Break: xor length <= 0.');
      start ++;
      continue;
    }

    let wait = _.filter(data, (d) => {
      return _.indexOf(xor, d.id + '') >= 0;
    });

    debug('wait: ', wait.length);

    var jobs = [];

    wait.forEach((d) => {
      jobs.push(Comment.build({
        market_app_id: app.id,
        m_id: d.id + '',
        content: d.content,
        publish_time: new Date(d.lastModificationTime)
      }).save());
    });

    yield jobs;

    start++ ;

    yield wait(5000);
  }

}
