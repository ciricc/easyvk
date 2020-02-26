'use strict'

const path = require('path')

let configuration = {}

// Default parameters
configuration.api_v = '5.75'
configuration.reauth = false
configuration.save_session = true
configuration.session_file = path.join(__dirname, '/.vksession')

// constants
configuration.PROTOCOL = 'https'
configuration.BASE_DOMAIN = 'vk.com'
configuration.MOBILE_SUBDOMAIN = 'm'
configuration.BASE_CALL_URL = configuration.PROTOCOL + '://' + 'api.' + configuration.BASE_DOMAIN + '/method/'
configuration.BASE_OAUTH_URL = configuration.PROTOCOL + '://' + 'oauth.' + configuration.BASE_DOMAIN + '/'

// It is windows client_id, you can change it here, but please, do not change
// variable name, it need for authentication by password and username

// windows
configuration.WINDOWS_CLIENT_ID = '3697615'
configuration.WINDOWS_CLIENT_SECRET = 'AlVXZFMUqyrnABp8ncuU'

// android
configuration.ANDROID_CLIENT_ID = '2274003'
configuration.ANDROID_CLIENT_SECRET = 'hHbZxrka2uZ6jB1inYsH'

// ios
configuration.IOS_CLIENT_ID = '3140623'
configuration.IOS_CLIENT_SECRET = 'VeWdmVclDCtn6ihuP1nt'

// Here is ids for platforms
configuration.platformIds = {
  '6': 'WINDOWS',
  '2': 'IOS',
  '4': 'ANDROID'
}

configuration.HTTP_CLIENT = {
  USER_AGENT: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
  COOKIE_PATH: path.join(__dirname, '.evk-cookies.json')
}

configuration.DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.81 Safari/537.36'

configuration.DEFAULT_UTILS = {}

module.exports = configuration
