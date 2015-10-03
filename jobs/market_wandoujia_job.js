import _ from 'lodash';
import request from './my_request';
import {Download, Score, Version, App, MarketApp, Comment} from '../app/models';

function MarketWandoujia(mapp) {

  if (!(this instanceof MarketWandoujia)) {
    return new MarketWandoujia(mapp);
  }

  this.mapp = mapp;

  //console.log('this.mapp: ', this.mapp);
}


MarketWandoujia.prototype.run = function*() {
  yield this._download_count();
  yield this._comment();
};

MarketWandoujia.prototype._download_count = function*() {

  var base_url = 'http://apis.wandoujia.com';
  var url = `/apps/v1/${this.mapp.apk_name}?v=5.1.1&udid=4e08a422f00e4f919d6fdfe37fae0abe5b34de54&channel=wandoujia_wap&vc=8900&capacity=3`;

  var body = yield request.call(this, base_url, url);

  var data = body.entity[0];

  //console.log('data: ', data);

  if ((this.mapp.current_version_code - 0) !== data.detail.appDetail.defaultVersionCode) {
    var ver = Version.build({
      market_app_id: this.mapp.id,
      version_code: data.detail.appDetail.defaultVersionCode + '',
      publish_time: new Date(data.detail.appDetail.updatedDate)
    });

    yield ver.save();
  }

  var attr = {
    tags: _.map(data.detail.appDetail.categories, 'name').join(','),
    category_1: _.pluck(_.filter(data.detail.appDetail.categories, {level: 1}), 'name')[0],
    category_2: _.pluck(_.filter(data.detail.appDetail.categories, {level: 2}), 'name')[0],
    current_version_code: data.detail.appDetail.defaultVersionCode + '',
    created_at: new Date()
  };

  console.log('attr: ', attr);

  yield this.mapp.updateAttributes(attr);


  var down = Download.build({
    market_app_id: this.mapp.id,
    download_total: data.detail.appDetail.installedCount,
    created_at: new Date() - 3600000
  });

  yield down.save();


  var score = Score.build({
    market_app_id: this.mapp.id,
    score: (data.detail.appDetail.likesRate - 0),
    created_at: new Date() - 3600000
  });

  yield score.save();
};

MarketWandoujia.prototype._comment = function *() {

  var base_url = 'http://comment.wandoujia.com';

  var pageNum = 0;
  var pageSize = 15;
  var flag = true;

  var last_comment = yield Comment.find({
    order: 'created_at DESC',
    where: {
      market_app_id: market_app_id
    }
  });

  var last_insert_time = last_comment ? new Date(last_comment.created_at).valueOf() : 0;
  console.log('last_insert_time: ', last_insert_time);

  var market_app_id = this.mapp.id;

  while (flag) {
    var url = `/comment/comment!getCommentSummary.action?pageNum=${pageNum}&pageSize=${pageSize}&target=${this.mapp.apk_name}`;

    var body = yield request.call(this, base_url, url);

    var comments = body.comments;

    console.log('comments length: ', comments.length);

    pageNum++;

    if (comments.length < pageSize) {
      flag = false;
    }


    var jobs = [];

    comments.forEach(function (mess) {
      if (new Date(mess.date).valueOf() <= last_insert_time) {
        console.log('this item was insert done.');
        return false;
      }

      jobs.push(Comment.build({
        content: mess.content,
        created_at: mess.date,
        market_app_id: market_app_id
      }).save())

    });

    yield jobs;

    console.log('all items are inserted.');

  }

};


module.exports = MarketWandoujia;
