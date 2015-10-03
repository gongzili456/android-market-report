import co from 'co';
import request from 'co-request';
import _ from 'lodash';


co(function*() {

  var index = 0;
  while (true) {

    let url = 'http://app.market.xiaomi.com/apm/search?channel=market_100_1_android&clientId=cd09e39267a2920053da1a7dddd9101f&co=CN&keyword=Keep%E5%85%8D%E8%B4%B9%E7%94%B5%E8%AF%9D&la=zh&marketVersion=147&os=2074855&page=0&sdk=22';
    let result = yield request({
      uri: url,
      gzip: true,
      timeout: 20000
    });

    let body = result.body;

    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    let data = body.listApp;

    let filter = _.filter(data, (a) => {
      return a.packageName === "com.cattle.kovocontact";
    });

    if (filter.length <= 0) {

      console.log('nothing....', JSON.stringify(body));
      return;
    }

    console.log('index: ', index++);
  }


});
