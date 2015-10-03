"use strict";

import {User} from '../models';
import config from 'config';
var parse = require('co-body');
import redis from '../../lib/redis';
import crypto from 'crypto';
import _ from 'lodash';

var debug = require('debug')('market:app:controllers:sign:');


function magicNum(len) {
  var nums = [];
  for (var i = 0; i < len; i++) {
    nums.push(Math.floor(Math.random() * 10));
  }
  return nums.join('');
}

function hashStr(str) {
  var hasher = crypto.createHash("md5");
  hasher.update(str);
  var hash_pass = hasher.digest("hex");
  return hash_pass;
}


export function *toSign() {
  this.body = yield this.render('login/login');
}


export function *doRegister() {
  let attr = yield parse.json(this);

  if (!attr.email || !attr.password || !attr.name) {
    return this.body = {
      status: 400,
      message: '请填写完整的表单'
    }
  }

  var has_user = yield User.find({
    where: {
      email: attr.email
    }
  });

  if (has_user) {
    return this.body = {
      status: 201,
      message: `This email {${attr.email}} is exist`
    }
  }

  let user = User.build({
    email: attr.email,
    password: hashStr(attr.password),
    name: attr.name
  });

  yield user.save();

  yield _bindSession.bind(this, user)();

  this.body = {
    status: 200,
    data: user
  }
}


function *_bindSession(admin) {
  this.session.user = admin;
}


export function *doSignin() {
  let attr = yield parse.json(this);

  let email = attr.email;
  let password = attr.password;

  debug('signup: email => ', email, 'password: ', password);

  var user = yield User.find({
    where: {
      email: email
    }
  });

  debug('user: ', user);

  if (!user) {
    return this.body = {
      status: '404',
      message: '没有该帐号信息'
    }
  }

  var hash_pass = hashStr(password);

  debug('hash_pass: ', hash_pass);

  if (hash_pass !== user.password) {
    return this.body = {
      status: 403,
      message: "手机号或密码错误"
    }
  }

  yield _bindSession.bind(this, user)();

  this.body = {
    status: 200,
    data: 'success'
  }
}


export function *signout() {
  delete this.session.user;
  this.redirect('/');
}


export function *modify_password() {

  var attr = yield parse.json(this);
  var phone = attr.phone;
  var password = attr.password;
  var password_confirm = attr.password_confirm;

  if (!password || !password_confirm) {
    return this.body = {
      status: '400',
      message: "数据字段不完整"
    }
  }

  if (password !== password_confirm) {
    return this.body = {
      status: '400',
      message: '两次输入不匹配'
    }
  }

  let v_state = yield redis.get(prefix + attr.phone);

  if (v_state !== verify_state) {
    return this.body = {
      status: 403,
      message: '请先验证短信验证码'
    }
  }

  yield redis.del(prefix + attr.phone);

  var hash_pass = hashStr(password);

  var user = yield User.scope('active').find({
    where: {
      phone: phone
    }
  });

  yield user.updateAttributes({password: hash_pass});

  this.body = {
    status: 200,
    message: 'success'
  }
}
