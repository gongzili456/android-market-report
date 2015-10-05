"use strict";

import Router from 'koa-router';
import requireDir from 'require-dir';
import authentication from '../lib/authentication';

let controllers = requireDir('./controllers');

export default ()=> {

  var router = new Router({
    prefix: ''
  });

  /**
   * Sign routes
   */

  router.post('/register', controllers.sign_controller.doRegister);

  router.get('/login', controllers.sign_controller.toSign);
  router.post('/login', controllers.sign_controller.doSignin);
  router.get('/signout', controllers.sign_controller.signout);


  /**
   * Search router
   */
  router.get('/searchapp', controllers.search_controller.toSearch);
  router.get('/search', controllers.search_controller.doSearch);

  /**
   * Apps routers
   */
  router.get('/apps', authentication, controllers.apps_controller.appList);
  router.post('/apps', authentication, controllers.apps_controller.addApp);
  router.delete('/apps/:id', authentication, controllers.apps_controller.delApp);

  /**
   * Home routers
   */
  router.get('/', authentication, function *() {
    this.body = yield this.render('home/index');
  });

  return router;
};
