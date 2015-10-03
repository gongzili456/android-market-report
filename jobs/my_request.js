var co_request = require('co-request');
const user_agent = 'Dalvik/2.1.0 (Linux; U; Android 5.1.1; Nexus 5 Build/LMY48B)';

export default function* request(base_url, url, encoding) {
  console.log('------------------------------------------------------------------');
  console.log('request: ', base_url + url);

  var result = yield co_request({
    baseUrl: base_url,
    uri: url,
    gzip: true,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': user_agent
    }
  });

  var body = result.body;

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  return body;
}

