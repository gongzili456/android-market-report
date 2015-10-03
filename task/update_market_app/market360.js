const debug = require('debug')('bz:app:task:update_market_app:market360:');

import co from 'co';
import request from 'co-request';
import {MarketApp, Download, Comment} from '../../app/models';
import _ from 'lodash';
import wait from 'co-wait';


export function *start(app) {

  debug('start market 360');

  yield updateInfo(app);

  yield updateDownloadCount(app);
  yield updateComment(app);
  debug('end market 360');

}


function *updateInfo(app) {
  let url = `http://182.118.31.51/api/search/all?q=${encodeURIComponent(app.app_name)}&src=ms_zhushou`;

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

  let data = body.data.app.data;

  debug('data: ', data);

  let filter = _.filter(data, (a) => {
    return a.apkid === app.apk_name;
  });

  debug('filter: ', filter);

  if (filter.length <= 0) {
    return;
  }

  yield app.updateAttributes({
    current_version: filter[0].version_name,
    current_version_code: filter[0].version_code,
    category_1: filter[0].category
  });
}

function *updateDownloadCount(app) {

  let url = `http://123.125.82.206/mintf/getAppInfoByIds?pname=${encodeURIComponent(app.apk_name)}&market_id=360market`;

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

  let data = body.data[0];

  debug('data: ', data);

  if (!data) {
    return;
  }

  let down = Download.build({
    market_app_id: app.id,
    download_total: data.download_times - 0
  });

  yield down.save();
}

function *updateComment(app) {

  var start = 0;
  var flag = true;


  while (flag) {
    let url = `﻿http://comment.mobilem.360.cn/comment/getComments?baike=${encodeURIComponent(app.m_app_id)}&level=0&start=${start}&count=50`;

    debug('comment url: ', url);

    let result = yield request({
      uri: url,
      timeout: 5000,
      gzip: true
    });
    let body = result.body;

    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    let data = body.data.messages;

    debug('comment data: ', _.map(data, 'msgid').join(','));

    if (start === 0) {
      yield app.updateAttributes({
        comment_count: body.data.total
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
          $in: _.map(data, 'msgid')
        },
        market_app_id: app.id
      }
    });

    let exist_ids = _.map(exist, 'm_id');

    debug('comment exist: ', exist_ids.join(','));

    let xor = _.xor(_.map(data, 'msgid'), exist_ids);

    debug('comment xor: ', xor.join(','));

    if (xor.length <= 0) {
      debug('Break: xor length <= 0.');
      start += 50;
      continue;
    }

    let wait = _.filter(data, (d) => {
      return _.indexOf(xor, d.msgid) >= 0;
    });

    debug('wait: ', wait.length);

    var jobs = [];

    wait.forEach((d) => {
      jobs.push(Comment.build({
        market_app_id: app.id,
        m_id: d.msgid,
        content: d.content,
        machine: d.model,
        version: d.version_name,
        score: d.score,
        publish_time: new Date(d.create_time)
      }).save());
    });

    yield jobs;

    start += 50;

    yield wait(5000);
  }
}

