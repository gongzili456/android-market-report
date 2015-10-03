"use strict";

import config from 'config'
var redis = require('redis').createClient(config.redis.port, config.redis.host);
var wrapper = require('co-redis');
var client = wrapper(redis);


export default client;
