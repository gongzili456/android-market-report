const debug = require('debug')('bz:app:task:update_market_app:baidu:');

import co from 'co';
import request from 'co-request';
import {MarketApp, Download, Comment, Version} from '../../app/models';
import _ from 'lodash';
import wait from 'co-wait';


export function *start(app) {

  debug('start market baidu');

  yield updateInfo(app);

  yield history(app);

  yield updateComment(app);

  debug('end market baidu');

}

function *updateInfo(app) {

  let url = `http://m.baidu.com/s?tn=native&st=10a001&word=${encodeURIComponent(app.app_name)}&pkname=com.baidu.appsearch&platform_version_id=22&ver=16785345`;

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

  let data = body.result.data;

  debug('data: ', data);

  let filter = _.filter(data, (a) => {
    return a.itemdata.package === app.apk_name;
  });

  debug('filter: ', filter, filter.length);

  if (filter.length <= 0) {
    return;
  }

  yield app.updateAttributes({
    doc_id: filter[0].itemdata.docid,
    group_id: filter[0].itemdata.groupid,
    package_id: filter[0].itemdata.packageid,
    current_version: filter[0].itemdata.versionname,
    current_version_code: filter[0].itemdata.versioncode
  });


  let down = Download.build({
    market_app_id: app.id,
    download_total: filter[0].itemdata.display_download - 0
  });

  yield down.save();
}

function *updateComment(app) {

  var start = 0;
  var group_index = 0;
  var comment_total = 0;
  var flag = true;

  let groups = yield Version.findAll({
    where: {
      market_app_id: app.id
    },
    attributes: ['group_id']
  });

  let groupids = _.map(groups, 'group_id');

  groupids.push(app.group_id);



  debug('comment groupids: ', groupids);

  while (flag) {

    let url = `http://m.baidu.com/appsrv?usertype=1&action=getcommentlist&pkname=com.baidu.appsearch&native_api=1&actiontype=getCommentList&groupid=${groupids[group_index]}&start=${start}&count=50&docid=${app.doc_id}&packageid=${app.package_id}`;
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

    let data = body.data;

    debug('comment data: ', _.map(data, 'reply_id').join(','));

    if (start === 0) {
      comment_total += (body.total_count - 0);
      debug('comment_total: ', comment_total, body.total_count - 0);
    }

    if (data.length <= 0) {
      debug('Next group');

      group_index++;

      if (group_index >= groupids.length) {
        debug('Break: data length <= 0.');
        flag = false;

        yield app.updateAttributes({
          comment_count: comment_total
        });
      }

      start = 0;

      continue;
    }

    let exist = yield Comment.findAll({
      where: {
        m_id: {
          $in: _.map(data, 'reply_id')
        },
        market_app_id: app.id
      }
    });

    let exist_ids = _.map(exist, 'reply_id');

    debug('comment exist: ', exist_ids.join(','));

    let xor = _.xor(_.map(data, 'qid'), exist_ids);

    debug('comment xor: ', xor.join(','));

    if (xor.length <= 0) {
      debug('Break: xor length <= 0.');
      start += 50;
      continue;
    }

    let wait = _.filter(data, (d) => {
      return _.indexOf(xor, d.qid) >= 0;
    });

    debug('wait: ', wait.length);

    var jobs = [];

    wait.forEach((d) => {
      jobs.push(Comment.build({
        market_app_id: app.id,
        m_id: d.reply_id,
        content: d.content,
        machine: d.reserved3.machine,
        version: d.reserved3.version,
        score: d.score,
        user_ip: d.user_ip,
        publish_time: new Date(d.create_time * 1000)
      }).save());
    });

    yield jobs;

    start += 50;

    yield wait(5000);
  }
}

function *history(app) {

  let url = `http://m.baidu.com/appsrv?usertype=1&action=detail&pkname=com.baidu.appsearch&native_api=1&gms=true&from=1009556z&is_support_webp=true&platform_version_id=22&ver=16785345&native_api=1&docid=${app.doc_id}`;

  debug('history url: ', url);

  let result = yield request({
    uri: url,
    timeout: 5000,
    gzip: true
  });

  let body = result.body;

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let data = body.result.data.app_moreversion;

  debug('history data: ', data);

  let data_ids = _.map(_.map(data, (con) => {
    return con.content[0];
  }), 'groupid');

  debug('history data_ids: ', data_ids.join(','));

  let exists = yield Version.findAll({
    package_id: app.package_id,
    group_id: {
      $in: data_ids
    }
  });

  let exist_ids = _.map(exists, 'group_id');

  debug('history exist: ', exist_ids.join(','));

  let xor = _.xor(data_ids, exist_ids);

  debug('history xor: ', xor.join(','));

  if (xor.length <= 0) {
    debug('history Break: xor length <= 0.');
    return;
  }

  let wait = _.filter(data, (d) => {
    return _.indexOf(xor, d.content[0].groupid) >= 0;
  });

  debug('history wait: ', wait.length);

  var jobs = [];

  wait.forEach((d) => {
    jobs.push(Version.build({
      market_app_id: app.id,

      group_id: d.content[0].groupid,
      package_id: d.content[0].packageid,
      doc_id: d.content[0].docid,
      version: d.version,
      publish_time: new Date(d.content[0].updatetime)
    }).save());
  });

  yield jobs;

}
