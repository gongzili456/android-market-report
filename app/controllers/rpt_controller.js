"use strict";

import {App, MarketApp, Market, sequelize} from '../models';
import config from 'config';
var parse = require('co-body');
import _ from 'lodash';
import assign from 'object-assign';
import moment from 'moment';

var debug = require('debug')('bz:app:controllers:report:');


export function *downloadCount() {

  let id = this.params.id;

  let app = yield this.session.user.getApps({
    where: {
      id: id
    }
  });

  if (app.length <= 0) {
    return this.body = {
      status: 400,
      message: 'you not follow this app'
    }
  }

  let market_app = yield MarketApp.findAll({
    where: {
      app_id: id
    }
  });

  let app_ids = _.map(market_app, 'id').join(',');

  debug('app_ids: ', JSON.stringify(market_app));

  yield handleParams.bind(this)();

  let result = yield sequelize.query(`select d.created_at as day, d.download_total, d.added, d.market_app_id, ma.market_id, m.name from rpt_download as d inner join market_app as ma on d.market_app_id = ma.id inner join market as m on m.id = ma.market_id where d.market_app_id in (${app_ids}) and TO_DAYS(d.created_at) - TO_DAYS('${this._start_date}') >= 0 and TO_DAYS(d.created_at) - TO_DAYS('${this._end_date}') <=  0`, {type: sequelize.QueryTypes.SELECT});

  let market_ids = _.uniq(_.map(result, 'market_id'));

  debug('market_ids: ', market_ids);

  let group = _.groupBy(result, (r)  => {
    return moment(r.day).format('YYYY-MM-DD');
  });


  this.body = {
    status: 200,
    data: yield complete(group, market_ids)
  }
}

function *complete(list, market_ids) {
  let markets = yield Market.findAll();

  let key_day = Object.keys(list);

  debug('key_day: ', key_day);

  key_day.forEach((key) => {
    let arr = list[key];
    if (arr.length < market_ids.length) {
      let xor = _.xor(_.map(arr, 'market_id'), market_ids);
      let market = _.find(markets, {id: xor[0]});

      arr.push({
        market_id: market.id,
        name: market.name,
        download_total: 0
      })
    }
  });

  //Translate

  let res_arr = [];

  key_day.forEach((key) => {
    res_arr.push({
      day: key,
      data: list[key]
    })
  })

  return res_arr;

}

function *handleParams() {

  let start = this.query.start;
  let end = this.query.end;

  debug('start: ', start, ' - end: ', end);


  if (!start || !end) {
    //this.throw(400, 'You need date start and end');

    let start_date = moment(start_date).subtract(8, 'days').startOf('day');
    let end_date = moment(start).subtract(1, 'days').startOf('day');

    this._start_date = start_date.format('YYYYMMDD');
    this._end_date = end_date.format('YYYYMMDD');

    debug('query date: ', this._start_date, ' ==> ', this._end_date);
    return;
  }

  let start_date = moment(start, 'YYYYMMDD').startOf('day');
  let end_date = moment(end, 'YYYYMMDD').startOf('day');

  debug(start_date, '-----', end_date);

  if (end_date.diff(moment(), 'days') > 0) {
    end_date = moment().startOf('day');
  }

  if (start_date.diff(end_date, 'days') > 0) {
    this.throw(400, 'Params error: start > end');
  }

  this._start_date = start_date.format('YYYYMMDD');
  this._end_date = end_date.format('YYYYMMDD');

  debug('query date: ', this._start_date, ' ==> ', this._end_date);
}
