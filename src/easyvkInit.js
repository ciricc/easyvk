
/*
 *@author: ciricc (Kirill Novak)
 *@license: MIT
 * @description : EasyVK is library for creating appliations based on VKontakte API
 *
 *Copyright (c) 2017-2018 Kirill Novak (https://ciricc.github.io/)
 *ALL UTILITIES OF THIS MODULE ARE DISTRIBUTED UNDER THE SAME LICENSE AND RULES
 *Docs: https://ciricc.github.io/
 */

'use strict'

const Debugger = require('./utils/debugger.class.js')
const staticMethods = require('./utils/staticMethods.js')
const configuration = require('./utils/configuration.js')
const EasyVKRequestsDebugger = require('./utils/debugger.js')

const EasyVK = require('./easyvk.js')

let debuggerRun = new EasyVKRequestsDebugger(Boolean(false))

const authTypes = EasyVK.authTypes

module.exports = Auth
module.exports.static = staticMethods
module.exports.debuggerRun = debuggerRun
module.exports.version = EasyVK.version
module.exports.callbackAPI = EasyVK.callbackAPI
module.exports.streamingAPI = EasyVK.streamingAPI
module.exports.classes = EasyVK.class
module.exports.is = EasyVK.is
module.exports.Debugger = Debugger
module.exports.authTypes = authTypes
module.exports.USER_AUTH_TYPE = authTypes[0]
module.exports.GROUP_AUTH_TYPE = authTypes[1]
module.exports.APPLICATION_AUTH_TYPE = authTypes[2]

/** Exporting static methods */
for (let prop of Object.getOwnPropertyNames(staticMethods)) {
  if (['prototype', 'length', 'name'].indexOf(prop) === -1) {
    module.exports[prop] = staticMethods[prop]
  }
}

/**
 *
 *  This function check all parameters
 *  @see createSession()
 *  @return {Promise}
 *  @promise Check errors
 *  @resolve {Object} changed user parameters for create session
 *  @reject {Error} auth error or just an error from responses
 *
 */

async function checkInitParams (params = {}) {
  return new Promise((resolve, reject) => {
    if (params.save !== undefined) {
      params.save_session = params.save
    }

    if (params.token !== undefined) {
      params.access_token = params.token
    }

    if (params.v !== undefined) {
      params.api_v = params.v
    }

    if (params.captchaSid !== undefined) {
      params.captcha_sid = params.captchaSid
    }

    if (params.captchaKey !== undefined) {
      params.captcha_key = params.captchaKey
    }

    if (params.clientId !== undefined) {
      params.client_id = params.clientId
    }

    if (params.clientSecret !== undefined) {
      params.client_secret = params.clientSecret
    }

    if (params.sessionFile !== undefined) {
      params.session_file = params.sessionFile
    }

    if (params.save_session !== false) {
      params.save_session = configuration.save_session
    }

    if (params.session_file) {
      if (!staticMethods.isString(params.session_file)) {
        return reject(new Error('The session_file must be a string'))
      }
    } else {
      params.session_file = configuration.session_file
    }

    if (params.api_v && params.api_v !== configuration.api_v) {
      if (isNaN(params.api_v.toString())) {
        return reject(new Error('The api_v parameter must be numeric'))
      } else if (Number(params.api_v) < 5) {
        return reject(new Error('The api_v parameter must be more then 5.0 version, other not support'))
      }
    } else {
      params.api_v = configuration.api_v
    }

    if (params.captcha_key && !params.captcha_sid) {
      return reject(new Error('You puted captcha_key but not using captcha_sid parameter'))
    } else if (!params.captcha_key && params.captcha_sid) {
      return reject(new Error('You puted captcha_sid but not puted captcha_key parameter'))
    } else if (params.captcha_key && params.captcha_sid) {
      if (isNaN(params.captcha_sid.toString())) {
        return reject(new Error('The captcha_sid must be numeric'))
      }
    }

    if (params.reauth !== true) {
      params.reauth = configuration.reauth
    }

    if (params.reauth) {
      if (params.access_token && params.username) {
        return reject(new Error('Select only one way auth: access_token XOR username'))
      }

      if (params.access_token) {
        if (!staticMethods.isString(params.access_token)) {
          return reject(new Error('The access_token must be a string'))
        }
      }

      if (params.username && !params.password) {
        return reject(new Error('Put password if you want aut with username'))
      }

      if (params.username && params.password) {
        params.username = params.username.toString()
        params.password = params.password.toString()
      }
    }

    if (params.platform) {
      if (!isNaN(Number(params.platform))) {
        // Get platform by ID

        params.platform = configuration.platformIds[params.platform]
      } else {
        // Get by matching
        let hashes = []
        let values = []

        for (let hash in configuration.platformIds) {
          hashes.push(hash)
          values.push(configuration.platformIds[hash])
        }

        let platform = params.platform
        platform = String(platform).toLocaleLowerCase()

        let resultPlatform

        values.forEach((value, index) => {
          value = value.toLocaleLowerCase()
          if (value.match(platform)) {
            // save it
            resultPlatform = configuration.platformIds[String(hashes[index])]
          }
        })

        if (resultPlatform) {
          params.platform = resultPlatform
        } else {
          params.platform = undefined
        }

        hashes = undefined
        values = undefined
      }
    }

    if (!params.client_id || !params.client_secret) {
      if (params.platform) {
        params.client_id = configuration[params.platform + '_CLIENT_ID']
        params.client_secret = configuration[params.platform + '_CLIENT_SECRET']
      } else {
        params.client_id = configuration['ANDROID_CLIENT_ID']
        params.client_secret = configuration['ANDROID_CLIENT_SECRET']
      }
    }

    params.lang = String(params.lang)

    if (!params.lang) {
      params.lang = 'ru'
    }

    if (staticMethods.isString(params.fields)) {
      params.fields = params.fields.split(',')
    }

    if (!params.fields || !Array.isArray(params.fields)) {
      params.fields = []
    } else {
      params.fields = params.fields.map(a => String(a))
    }

    if (!params.userAgent) {
      params.userAgent = configuration.DEFAULT_USER_AGENT
    }

    if (!params.utils) {
      params.utils = configuration.DEFAULT_UTILS
    }

    if (!params.mode) {
      params.mode = ''
    }

    if (staticMethods.isString(params.mode)) {
      params.mode = {
        name: params.mode
      }
    }

    if (!params.mode.name) {
      params.mode.name = 'default'
    }

    if (params.authType && authTypes.indexOf(params.authType) === -1) {
      return reject(new Error('Auth type must be contents in ' + JSON.stringify(authTypes)))
    } else if (params.authType && !params.access_token) {
      params.authType = null
    }

    if (params.debug && !(params.debug instanceof Debugger)) return reject(new Error('Debug parameter must instances only from Debugger class'))

    resolve(params)
  })
}

/*
 *  This function check you easyVK(params) parameters
 *  @param {Object} params - Settings for authentication, for create session
 *  @param {Boolean} [params.save_session=true] - If is true then session will be saved in params.session_file file
 *  @param {(String|Number)} [params.api_v=5.73] - API version for all requests, I am
 *  recommend you use API version >= 5
 *  @param {String} [params.access_token=] - Your access token, group or user. If is user token then
 *  easyVK will get user_id for you, else [group_id, screen_name, group_name] for session file
 *  @param {String|Number} [params.username] - Your login for authenticate, your_email@example.com or +7(916)7888886 (example)
 *  It need only if you puted params.password and not puted params.access_token parameter
 *  @param {String|Number} [params.password] - Your password for user account, it will be authenticated
 *  from windows app_id, from official client. I am not saving your data for hack, all is opened for you
 *  @param {Boolean} [params.reauth=false] - Need ignore session file and log in with newest parameters?
 *  @param {String} [params.session_file=.vksession] - Path for your session file, i am recommend you to use the path module
 *  for create path.join(__dirname, '.session-vk')
 *  @param {String|Number} [params.code] - Is your code from application which generate your 2-factor-auth
 *  code
 *  @param {String} [params.captcha_key] - Is your code from captcha, only if you got an error and not solved it
 *  before
 *  @param {String|Number} [params.captcha_sid] - Is a captcha id from captcha error, if you got it and not solved before
 *  @param {Function|Async Function} [params.captchaHandler] - Is a captcha Handler function for
 *  handle all captcha errors
 *
 *  @promise Authenticate you and create session
 *  @resolve {Object} EasyVK object, which contents session and all methods
 *  for work with VKontakte API
 *
 */

async function Auth (params = {}) {
  return checkInitParams(params).then((p) => {
    let vk = new EasyVK(p, debuggerRun)
    return vk._init()
  })
}
