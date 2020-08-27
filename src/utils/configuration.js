'use strict'

import path from 'path'

const PROTOCOL = 'https'
const BASE_DOMAIN = 'vk.com'

export default {

  api_v: '5.101',
  reauth: false,
  save_session: true,
  session_file: path.join(process.cwd(), './vksession'),

  PROTOCOL,
  BASE_DOMAIN,
  MOBILE_SUBDOMAIN: 'm',

  BASE_CALL_URL: PROTOCOL + '://' + 'api.' + BASE_DOMAIN + '/method/',
  BASE_OAUTH_URL: PROTOCOL + '://' + 'oauth.' + BASE_DOMAIN + '/',

  ANDROID_CLIENT_ID: '2274003',
  ANDROID_CLIENT_SECRET: 'hHbZxrka2uZ6jB1inYsH',

  HTTP_CLIENT: {
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36',
    COOKIE_PATH: path.join(process.cwd(), '.evk-cookies.json')
  },

  DEFAULT_USER_AGENT_STATIC: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36',

  DEFAULT_UTILS: {},
  DEFAULT_USER_AGENT: 'VKAndroidApp/6.2-5112 (Android 6.0; SDK 23; arm64-v8a; alps Razar; ru; 1280x720)'
}
