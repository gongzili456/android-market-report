module.exports = {

  /**
   * 360
   */
  1: {
    detail: {
      base: 'http://123.125.82.206',
      path: '/mintf/getAppInfoByIds?pname={{apk_name}}&market_id=360market&timestamp={{now}}'
    },

    comment: {
      base: '﻿http://comment.mobilem.360.cn',
      path: '/comment/getComments?baike={{m_app_id}}&level=0&start=0&count=8'
    },

    version: {
      base: 'http://123.125.82.206',
      path: '/detail/apphistorydl?sid={{m_app_id}}&current_ver={{current_version_code}}&format=json&os=22&webp=1'
    }
  },

  /**
   * 百度
   */
  2: {
    detail: {
      base: 'http://m.baidu.com',
      path: '/s?tn=native&st=10a001&word={{app_name}}&native_api=1&from=1009556z&network=WF&country=CN&psize=3&is_support_webp=true&language=zh&platform_version_id=22&ver=16785345&native_api=1&pn=0&f=clientsug'
    },

    comment: {
      base: 'http://m.baidu.com',
      path: '/appsrv?usertype=1&action=getcommentlist&pkname=com.baidu.appsearch&native_api=1&gms=true&from=1009556z&network=WF&psize=3&country=CN&is_support_webp=true&language=zh&apn=&platform_version_id=22&ver=16785345&&native_api=1&actiontype=getCommentList&groupid=3151989&start=0&count=10&docid={{docid}}&packageid={{apk_name}}&version={{current_version}}&groupids=3151989%403145703%403131399%403123934%403101268%403091366%403081254%403053538%403050037&machine=Nexus%205&osversion=5.1.1'
    }
  },

  /**
   * 应用宝
   */
  3: {
    detail: {
      base: ''
    },

    comment: {
      base: '',
      path: ''
    }
  },


  /**
   * 豌豆荚
   */
  4: {
    detail: {
      base: ''
    },

    comment: {
      base: '',
      path: ''
    }
  },


  /**
   * 小米
   */
  5: {
    detail: {
      base: ''
    },

    comment: {
      base: '',
      path: ''
    }
  }


};