import _ from 'lodash';
import request from './my_request';
import {Download, Score, Version, App, MarketApp, Comment} from '../app/models';


function MarketXiaomi(mapp) {

  if (!(this instanceof MarketXiaomi)) {
    return new MarketXiaomi(mapp);
  }

  this.mapp = mapp;

  console.log('mapp: ', this.mapp);
}


MarketXiaomi.prototype.run = function*() {
  //yield this._download_count();

  yield this._comment();
};

MarketXiaomi.prototype._download_count = function*() {

  var base_url = 'http://app.market.xiaomi.com';
  var url = `/apm/app/id/${this.mapp.m_app_id}?channel=market_100_1_android&clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&densityScaleFactor=3.0&imei=5c15986252967f1c7fc87d57bd9a0490&la=zh&marketVersion=147&model=Nexus+5&os=2074855&ref=search&refPosition=0&resolution=1080*1776&sdk=22&session=VjAD4q2xh7ue__TW`;

  var body = yield request.call(this, base_url, url);


  var data = body.app;

  if ((this.mapp.current_version_code - 0) !== data.versionCode) {
    console.log('update to new version');

    var ver = Version.build({
      current_version: data.versionName,
      current_version_code: data.versionCode,
      market_app_id: this.mapp.id,
      publish_time: new Date(data.updateTime)
    });
    yield ver.save();
  }

  var attr = {
    current_version: data.versionName,
    current_version_code: data.versionCode + '',
    tags: data.keyWords.split(';').join(','),
    category_1: data.level1CategoryId + '',
    category_2: data.level2CategoryId + '',
    created_at: new Date()
  };

  console.log('attr: ', attr);

  yield this.mapp.updateAttributes(attr);


  var score = Score.build({
    market_app_id: this.mapp.id,
    score: (data.ratingScore - 0) * 20,
    created_at: new Date() - 3600000
  });

  yield score.save();
};


MarketXiaomi.prototype._comment = function*() {

  var base_url = 'http://app.market.xiaomi.com';

  var page = 0;

  var flag = true;
  var market_app_id = this.mapp.id;

  var last_comment = yield Comment.find({
    order: 'created_at DESC',
    where: {
      market_app_id: market_app_id
    }
  });

  var last_insert_time = last_comment ? new Date(last_comment.created_at).valueOf() : 0;
  console.log('last_insert_time: ', last_insert_time);

  while (true) {
    var url = `/apm/comment/list/${this.mapp.m_app_id}?channel=market_100_1_android&clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&densityScaleFactor=3.0&imei=5c15986252967f1c7fc87d57bd9a0490&la=zh&marketVersion=147&model=Nexus+5&os=2074855&page=${page}&resolution=1080*1776&sdk=22&session=VjAD4q2xh7ue__TW`;
    var body = yield request.call(this, base_url, url);

    if (body.comments.length <= 0) {
      console.log('no next page.');
      flag = false;
      return false;
    }
    page++;

    var comments = body.comments;

    var jobs = [];

    comments.forEach(function (mess) {

      if (mess.updateTime <= last_insert_time) {
        console.log('this item was created done.');
        return false;
      }

      jobs.push(Comment.build({
        content: mess.commentValue,
        created_at: mess.updateTime,
        market_app_id: market_app_id,
        score: mess.pointValue,
        version: mess.versionName
      }).save());

      console.log('created one');
    });

    console.log('created all.');
  }


};

module.exports = MarketXiaomi;
