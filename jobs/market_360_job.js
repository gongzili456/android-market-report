
import request from './my_request';
import {Download, Score, Version, App, MarketApp, Comment} from '../app/models';


function Market360(mapp) {

  if (!(this instanceof Market360)) {
    return new Market360(mapp);
  }

  this.mapp = mapp;


  //console.log('this.mapp:', mapp);
}

Market360.prototype.run = function* () {
  yield this._history();
  yield this._download_count();
  yield this._score();
  yield this._comment();
};

Market360.prototype._download_count = function* () {

  console.log('apk_name: ', this.mapp.apk_name);

  var now = new Date().valueOf();
  var download_url = `/mintf/getAppInfoByIds?pname=${this.mapp.apk_name}&market_id=360market&timestamp=${now}`;
  var download_base_url = 'http://123.125.82.206';

  var body = yield request.call(this, download_base_url, download_url);

  var data = body.data[0];

  console.log('data: ', data);

  if (this.mapp.current_version_code !== data.version_code) {
    console.log('update to new version');
    var ver = Version.build({
      market_app_id: this.mapp.id,
      version: data.version_name,
      version_code: data.version_code,
      publish_time: data.update_time
    });
    yield ver.save();
  }

  var attr = {
    current_version: data.version_name,
    current_version_code: data.version_code,
    tags: data.list_tag.split(' ').join(','),
    category_1: data.category_level1_ids,
    category_2: data.category_level2_ids,
    created_at: new Date()
  };


  console.log('attr: ', attr);

  yield this.mapp.updateAttributes(attr);

  var down = Download.build({
    market_app_id: this.mapp.id,
    download_total: body.data[0].download_times,
    created_at: new Date() - 3600000
  });

  yield down.save();


  var score = Score.build({
    market_app_id: this.mapp.id,
    score: (body.data[0].rating - 0) * 10,
    created_at: new Date() - 3600000
  });

  yield score.save();

};


Market360.prototype._score = function* () {

  var base_url = '﻿http://comment.mobilem.360.cn';
  var url = `/comment/getScore?objid=${this.mapp.m_app_id}`;

  var body = yield request.call(this, base_url, url);

  console.log('body: ', body);
};


Market360.prototype._comment = function* () {

  var start = 0;
  var total = 100;

  var base_url = '﻿http://comment.mobilem.360.cn';

  var flag = true;

  var market_app_id = this.mapp.id;
  console.log('market_app_id: ', market_app_id);

  var last_comment = yield Comment.find({
    order: 'created_at DESC',
    where: {
      market_app_id: market_app_id
    }
  });

  var last_insert_time = last_comment ? new Date(last_comment.created_at).valueOf() : 0;
  console.log('last_insert_time: ', last_insert_time);


  while (flag) {
    var url = `/comment/getComments?baike=${this.mapp.m_app_id}&level=0&start=${start}&count=50`;
    var body = yield request.call(this, base_url, url);
    var data = body.data;

    total = data.total;
    start += 50;

    if (data.messages.length < 50) {
      flag = false;
    }

    console.log('message: length: ', data.messages.length);
    //console.log('message: length: ', data.messages[0]);
    console.log('message: total: ', data.total);

    var jobs = [];

    console.log('ready to for each.');

    data.messages.forEach(function (mess) {

      if (new Date(mess.create_time).valueOf() <= last_insert_time) {
        console.log('inserted the last item');
        //flag = false;
        return false;
      }

      var com = {
        content: mess.content,
        created_at: mess.create_time,
        market_app_id: market_app_id,
        score: mess.score,
        machine: mess.model
      };

      console.log('com: ', com);

      jobs.push(Comment.build(com).save());
    });

    console.log('jobs: ', jobs);
    yield jobs;

    console.log('done. yield jobs.')
  }
  console.log('comment all saved.');
};


Market360.prototype._history = function* () {
  var base_url = 'http://123.125.82.206';
  var url = `/detail/apphistorydl?sid=${this.mapp.m_app_id}&current_ver=${this.mapp.current_version_code}&format=json&os=22&webp=1`;

  var body = yield request.call(this, base_url, url);

  console.log('body: ', body);

  var data = body.data;

  var market_app_id = this.mapp.id;

  var last_insert = yield Version.find({
    order: 'publish_time DESC',
    where: {
      market_app_id: market_app_id
    }
  });

  var last_insert_time = last_insert ? new Date(last_insert.publish_time).valueOf() : 0;
  console.log('last_insert_time: ', last_insert_time);

  var jobs = [];

  data.forEach(function(version) {
    if (new Date(version.create_time).valueOf() <= last_insert_time) {
      console.log('inserted the last item');
      return false;
    }

    jobs.push(Version.build({
      market_app_id: market_app_id,
      version: version.version_name,
      version_code: version.version_code,
      publish_time: version.create_time
    }).save())
  });

  yield jobs;
  console.log('all versions insert done.');
};

module.exports = Market360;
