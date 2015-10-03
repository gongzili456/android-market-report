const debug = require('debug')('bz:lib:authentication:');

import {User} from '../app/models';

import _ from 'lodash';

export default function*(next) {


  if (!this.session.user) {
    debug('request redirect login ...');
    return this.redirect('/login');
  }

  this.session.user = yield User.find({
    where: {
      id: this.session.user.id
    }
  });

  if (this.path === '/') {
    return yield next;
  }

  if (this.session.user.status !== 0) {
    debug('status !== 0', this.session.user.status);
    return this.redirect('/');
  }

  debug('request pass next ...');


  yield next;
}
