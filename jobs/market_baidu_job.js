import _ from 'lodash';
import request from './my_request';
import {Download, Score, Version, App, MarketApp, Comment} from '../app/models';



function MarketBaidu(mapp) {

  if (!(this instanceof MarketBaidu)) {
    return new MarketBaidu(mapp);
  }

  this.mapp = mapp;
  //console.log('this.mapp:', mapp);

}

MarketBaidu.prototype.run = function*() {

  yield this._history();

  yield this._download_count();

  yield this._comment();

};

MarketBaidu.prototype._download_count = function*() {
  var package_name = this.mapp.apk_name;

  var base_url = 'http://m.baidu.com';
  var url = `/s?tn=native&st=10a001&word=${this.mapp.app_name}&native_api=1&from=1009556z&network=WF&country=CN&psize=3&is_support_webp=true&language=zh&platform_version_id=22&ver=16785345&native_api=1&pn=0&f=clientsug`;

  var body = yield request.call(this, base_url, url);

  if (body.error_no) {
    console.log('Market Baidu download count ERROR: ', JSON.stringify(body));
    this.throw('Market Baidu download count ERROR: ', JSON.stringify(body));
  }

  var data = body.result.data;

  if (!data) {
    console.log('Search nothing.');
    return;
  }

  var itemData = _.filter(data, function (item) {
    return item.itemdata.package === package_name;
  });

  if (!itemData) {
    console.log('Nothing Found.');
    return;
  }

  console.log('ItemData: ', itemData[0]);

  data = itemData[0].itemdata;

  console.log('bijiao: ', this.mapp.current_version_code !== data.versioncode);
  if (this.mapp.current_version_code !== data.versioncode) {
    console.log('-=-=-=')
    var ver = Version.build({
      market_app_id: this.mapp.id,
      version: data.versionname,
      version_code: data.versioncode,
      publish_time: new Date(data.updatetime)
    });
    yield ver.save();
  }

  var attr = {
    group_id: data.groupid,
    current_version: data.versionname,
    current_version_code: data.versioncode,
    created_at: new Date()
  };

  console.log('attr: ', attr);

  yield this.mapp.updateAttributes(attr);

  var down = Download.build({
    market_app_id: this.mapp.id,
    download_total: data.display_download,
    created_at: new Date() - 3600000
  });

  yield down.save();

  var score = Score.build({
    market_app_id: this.mapp.id,
    score: (data.score - 0),
    created_at: new Date() - 3600000
  });

  yield score.save();
};


MarketBaidu.prototype._comment = function*() {

  var base_url = 'http://m.baidu.com';

  var group_id = this.mapp.group_id;

  var flag = true;
  var start = 0;
  var page_size = 10;

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

  var totals = 0;
  while (flag) {
    var url = `/appsrv?usertype=1&action=getcommentlist&pkname=com.baidu.appsearch&native_api=1&gms=true&from=1009556z&network=WF&psize=3&country=CN&is_support_webp=true&language=zh&apn=&platform_version_id=22&ver=16785345&native_api=1&actiontype=getCommentList&groupid=${group_id}&start=${start}&count=${page_size}&docid=${this.mapp.doc_id}&packageid=${this.mapp.package_id}&version=1.4.2&groupids=3151989%403145703%403131399%403123934%403101268%403091366%403081254%403053538%403050037&machine=Nexus%205&osversion=5.1.1`;

    var body = yield request.call(this, base_url, url);

    var data = body.data;


    var total_count = body.total_count;
    console.log('total: ', total_count);

    if (Object.keys(total_count).length > 1) {
      console.log('total_count length > 0');
      group_id = Object.keys(total_count)[0];

      var pre_index = start + page_size;

      for (var i = Object.keys(total_count).length - 1; i >= 0; i--) {
        console.log('pre_index: ', pre_index);
        console.log(total_count, 'i: ', i, ' value: ', total_count[Object.keys(total_count)[i]]);
        pre_index = pre_index - (total_count[Object.keys(total_count)[i]] - 0);
      }
      if (pre_index <= 0) {
        pre_index += (total_count[_.first(Object.keys(total_count))] - 0);
        console.log('return false', pre_index);
        start = pre_index;
      }
    } else {
      start += page_size;
    }
    console.log('start = ', start);
    totals += data.length;

    if (data.length < page_size) {
      console.log('there is last page.');
      flag = false;
    }

    console.log('comment: ', body.data.length, totals);
    //console.log('comment: ', body.data[0]);


    var jobs = [];

    data.forEach(function (comment) {

      if (new Date(comment.create_time - 0).valueOf() <= last_insert_time) {
        console.log('item created done.');
        return false;
      }

      var com = {
        content: comment.content,
        created_at: new Date(comment.create_time - 0),
        market_app_id: market_app_id,
        version: comment.reserved3['version'],
        machine: comment.reserved3['machine'],
        user_ip: comment.user_ip,
        score: comment.like_count - 0
      };

      jobs.push(Comment.build(com).save());

    });

    console.log('jobs: ', jobs.length);
    yield jobs;

    console.log('done. yield jobs.')

  }
  console.log('comment all saved.');


};

MarketBaidu.prototype._history = function*() {

  var base_url = 'http://m.baidu.com';
  var url = `/appsrv?usertype=1&action=detail&firstdoc=&pkname=com.baidu.appsearch&native_api=1&gms=true&from=1009556z&network=WF&country=CN&is_support_webp=true&language=zh&platform_version_id=22&ver=16785345&native_api=1&docid=7892258`;

  var body = yield request.call(this, base_url, url);

  if (body.error_no) {
    console.log('have an error.');
    return;
  }

  var data = body.result.data.app_moreversion;

  console.log('versions: ', JSON.stringify(data[0], '\t'));


  var jobs = [];

  var market_app_id = this.mapp.id;

  var last_insert = yield Version.find({
    order: 'publish_time DESC',
    where: {
      market_app_id: market_app_id
    }
  });

  var last_insert_time = last_insert ? new Date(last_insert.publish_time).valueOf() : 0;
  console.log('last_insert_time: ', last_insert_time);

  data.forEach(function (vsersion) {
    if (new Date(vsersion.content[0].updatetime).valueOf() <= last_insert_time) {
      console.log('inserted the last item');
      return false;
    }

    jobs.push(Version.build({
      market_app_id: market_app_id,
      version: vsersion.version,
      publish_time: new Date(vsersion.content[0].updatetime)
    }).save());
  });

  yield jobs;
};


module.exports = MarketBaidu;
