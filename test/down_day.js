import {Download} from '../app/models';
import co from 'co';

co(function *() {
  let m_app_id = 1;

  while (m_app_id <= 153) {

    let downloads = yield Download.findAll({
      where: {
        market_app_id: m_app_id
      }
    });

    console.log('downloads:', JSON.stringify(downloads));

    downloads.reduce(function(pre, current, index, arr) {
      console.log('pre: ', JSON.stringify(pre));

      if (pre) {
        co(function*() {
          yield pre.updateAttributes({
            added: current.download_total - pre.download_total
          });
        })
      }

      return current;
    }, null);


    m_app_id++;
  }

});
