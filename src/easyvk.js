
const request = require('request')
const URL = require('url')
const fs = require('fs')

// Modules

const staticMethods = require('./utils/staticMethods.js')
const EasyVKUploader = require('./utils/uploader.js')
const EasyVKLongPoll = require('./utils/longpoll.js')
const EasyVKCallbackAPI = require('./utils/callbackapi.js')
const EasyVKStreamingAPI = require('./utils/streamingapi.js')
const EasyVKWidgets = require('./utils/widgets.js')
const configuration = require('./utils/configuration.js')
const EasyVKRequestsDebugger = require('./utils/debugger.js')
const EasyVKBotsLongPoll = require('./utils/botslongpoll.js')
const EasyVKSession = require('./utils/session.js')
const EasyVKHttp = require('./utils/http.js')
const easyVKErrors = require('./utils/easyvkErrors.js')
const EasyVKMiddlewares = require('./utils/middlewares.js')

const HttpsProxyAgent = require('https-proxy-agent')
const SocksProxyAgent = require('socks-proxy-agent')

const https = require('https')

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

/**
 *  EasyVK module. In this module creates session by your params
 *  And then you will get a EasyVK object (Session creates in the easyvkInit.js file)
 *  Author: @ciricc
 *  License: MIT
 *
 */

class EasyVK {
  // Here will be created session
  constructor (params, resolve, reject, debuggerRun) {
    let session = {}

    let self = this

    self.params = params

    self.debugger = new EasyVKRequestsDebugger(self)
    self.debuggerRun = debuggerRun || self.debugger
    self._errors = easyVKErrors

    self._errors.setLang(params.lang)

    if (params.proxy) {
      let options = new URL(params.proxy)

      options.keepAlive = true
      options.keepAliveMsecs = 30000

      if (options.protocol.match('socks')) {
        self.agent = new SocksProxyAgent(options, true)
      } else { self.agent = new HttpsProxyAgent(options) }
    } else {
      self.agent = new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 30000
      })
    }

    if (!params.reauth) {
      let data = fs.readFileSync(params.session_file)

      if (data) {
        try {
          data = JSON.parse(data)

          if (data.access_token) {
            session = new EasyVKSession(self, data)
            initToken()
          } else {
            if (!(params.username && params.password) && !params.access_token && !params.client_id && params.client_secret) {
              return reject(self._error('empty_session'))
            }
          }
        } catch (e) {
          if (!(params.username && params.password) && !params.access_token) {
            return reject(self._error('session_not_valid'))
          }
        }
      } else {
        if (!(params.username && params.password) && !params.access_token) {
          return reject(self._error('empty_session'))
        }
      }
    }

    if (!session.access_token) { // If session file contents access_token, try auth with it
      if (params.access_token) {
        session.access_token = params.access_token
        initToken()
      } else if (params.username) {
        // Try get access_token with auth
        let getData = {
          username: params.username,
          password: params.password,
          client_id: params.client_id || configuration.WINDOWS_CLIENT_ID,
          client_secret: params.client_secret || configuration.WINDOWS_CLIENT_SECRET,
          grant_type: 'password',
          v: params.api_v,
          lang: params.lang,
          device_id: '',
          libverify_support: 1
        }

        if (params.captcha_key) {
          getData.captcha_sid = params.captcha_sid
          getData.captcha_key = params.captcha_key
        }

        if (params.code && params.code.toString().length !== 0) {
          getData['2fa_supported'] = 1
          getData.code = params.code
        }

        getData = staticMethods.urlencode(getData)

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('request', configuration.BASE_OAUTH_URL + 'token/?' + getData)
          } catch (e) {
            // Ignore
          }
        }

        request.get({
          url: configuration.BASE_OAUTH_URL + 'token/?' + getData,
          headers: {
            'User-Agent': 'KateMobileAndroid/52.2.1 lite-447 (Android 6.0; SDK 23; arm64-v8a; alps Razar; ru)'
          },
          agent: self.agent
        }, (err, res) => {
          if (err) {
            return reject(new Error(`Server was down or we don't know what happaned [responseCode ${(res || { statusCode: 0 }).statusCode}]`))
          }

          let vkr = res.body

          if (self.debuggerRun) {
            try {
              self.debuggerRun.push('response', vkr)
            } catch (e) {
              // Ignore
            }
          }

          if (vkr) {
            let json = staticMethods.checkJSONErrors(vkr, reject)

            if (json) {
              session = JSON.parse(JSON.stringify(json))
              session.user_id = null
              initToken()
            }
          } else {
            return reject(self._error('empty_response', {
              response: vkr
            }))
          }
        })
      } else if (params.client_id) {
        let getData = {
          client_id: params.client_id || configuration.WINDOWS_CLIENT_ID,
          client_secret: params.client_secret || configuration.WINDOWS_CLIENT_SECRET,
          grant_type: 'client_credentials',
          v: params.api_v,
          lang: params.lang
        }

        if (params.captcha_key) {
          getData.captcha_sid = params.captcha_sid
          getData.captcha_key = params.captcha_key
        }

        if (params.code && params.code.toString().length !== 0) {
          getData['2fa_supported'] = 1
          getData.code = params.code
        }

        getData = staticMethods.urlencode(getData)

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('request', configuration.BASE_OAUTH_URL + 'token/?' + getData)
          } catch (e) {
            // Ignore
          }
        }

        request.get({
          url: configuration.BASE_OAUTH_URL + 'token/?' + getData,
          agent: self.agent
        }, (err, res) => {
          if (err) {
            return reject(new Error(`Server was down or we don't know what happaned [responseCode ${res.statusCode}]`))
          }

          let vkr = res.body

          if (self.debuggerRun) {
            try {
              self.debuggerRun.push('response', vkr)
            } catch (e) {
              // Ignore
            }
          }

          if (vkr) {
            let json = staticMethods.checkJSONErrors(vkr, reject)

            if (json) {
              session = JSON.parse(JSON.stringify(json))
              session.user_id = null
              session.credentials_flow = 1
              initToken()
            }
          } else {
            return reject(self._error('empty_response', {
              response: vkr
            }))
          }
        })
      }
    }

    function initToken () {
      if (!session.user_id && !session.group_id) {
        let token, getData

        token = session.access_token || params.access_token

        if (session.credentials_flow) {
          self.__credentials_flow_type = true
          self.session = session

          initResolve(self)
        } else {
          getData = {
            access_token: token,
            v: params.api_v,
            fields: params.fields.join(',')
          }

          getData = staticMethods.urlencode(getData)

          request.get({
            url: configuration.BASE_CALL_URL + 'users.get?' + getData,
            agent: self.agent
          }, (err, res) => {
            if (err) {
              return reject(new Error(err))
            }

            let vkr = res.body

            if (self.debuggerRun) {
              try {
                self.debuggerRun.push('response', vkr)
              } catch (e) {
                // Ignore
              }
            }

            if (vkr) {
              let json = staticMethods.checkJSONErrors(vkr, reject)
              if (json) {
                if (Array.isArray(json) && json.length === 0) {
                  appToken()
                } else {
                  session.user_id = json[0].id
                  session.first_name = json[0].first_name
                  session.last_name = json[0].last_name

                  for (let i = 0; i < params.fields.length; i++) {
                    if (json[0][params.fields[i]]) {
                      session[params.fields[i]] = json[0][params.fields[i]]
                    }
                  }

                  self.session = session
                  initResolve(self)
                }
              }
            } else {
              return reject(self._error('empty_response', {
                response: vkr,
                where: 'in auth with token (user)'
              }))
            }
          })
        }
      } else {
        self.session = session
        initResolve(self)
      }
    }

    function appToken () {
      let getData

      getData = staticMethods.urlencode({
        access_token: params.access_token,
        v: params.api_v,
        lang: params.lang,
        fields: params.fields.join(',')
      })

      if (self.debuggerRun) {
        try {
          self.debuggerRun.push('request', configuration.BASE_CALL_URL + 'groups.getById?' + getData)
        } catch (e) {
          // Ignore
        }
      }

      request.get({
        url: configuration.BASE_CALL_URL + 'apps.get?' + getData,
        agent: self.agent
      }, (err, res) => {
        if (err) {
          return reject(new Error(err))
        }

        let vkr = res.body

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('response', vkr)
          } catch (e) {
            // Ignore
          }
        }

        if (vkr) {
          let json

          json = staticMethods.checkJSONErrors(vkr, (e) => {
            if (e.error_code === 5) {
              groupToken()
            } else {
              reject(e)
            }
          })

          if (json) {
            json = json.items[0]

            if (Array.isArray(json) && json.length === 0) {
              groupToken()
            } else {
              session.app_id = json.id
              session.app_title = json.title
              session.app_type = json.type
              session.app_icons = [json.icon_75, json.icon_150]
              session.author = {
                id: json.author_id
              }

              session.app_members = json.members_count

              for (let i = 0; i < params.fields.length; i++) {
                if (json[params.fields[i]]) {
                  session[params.fields[i]] = json[params.fields[i]]
                }
              }

              self.session = session

              initResolve(self)
            }
          }
        } else {
          return reject(self._error('empty_response', {
            response: vkr,
            where: 'in auth with token (group)'
          }))
        }
      })
    }

    function groupToken () {
      let getData

      getData = staticMethods.urlencode({
        access_token: params.access_token,
        v: params.api_v,
        lang: params.lang,
        fields: params.fields.join(',')
      })

      if (self.debuggerRun) {
        try {
          self.debuggerRun.push('request', configuration.BASE_CALL_URL + 'groups.getById?' + getData)
        } catch (e) {
          // Ignore
        }
      }

      request.get({
        url: configuration.BASE_CALL_URL + 'groups.getById?' + getData,
        proxy: params.proxy
      }, (err, res) => {
        if (err) {
          return reject(new Error(err))
        }

        let vkr = res.body

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('response', vkr)
          } catch (e) {
            // Ignore
          }
        }

        if (vkr) {
          let json = staticMethods.checkJSONErrors(vkr, reject)

          if (json) {
            if (Array.isArray(json) && json.length === 0) {
              reject(self._error('access_token_not_valid'))
            } else {
              session.group_id = json[0].id
              session.group_name = json[0].name
              session.group_screen = json[0].screen_name

              for (let i = 0; i < params.fields.length; i++) {
                if (json[0][params.fields[i]]) {
                  session[params.fields[i]] = json[0][params.fields[i]]
                }
              }

              self.session = session
              initResolve(self)
            }
          }
        } else {
          return reject(self._error('empty_response', {
            response: vkr,
            where: 'in auth with token (group)'
          }))
        }
      })
    }

    function initResolve (s) {
      if (params.clean_session_file) {
        fs.writeFileSync(params.session_file, '{}')
      }

      if (!params.captchaHandler || !Object.prototype.toString.call(params.captchaHandler).match(/Function/)) {
        params.captchaHandler = ({ captcha_sid: captchaSid, captcha_key: captchaKey }) => {
          throw self._error('captcha_error', {
            captcha_key: captchaKey,
            captcha_sid: captchaSid
          })
        }
      }

      self.captchaHandler = params.captchaHandler
      self.uploader = new EasyVKUploader(self)
      self.longpoll = new EasyVKLongPoll(self)
      self.config = configuration
      self.callbackAPI = new EasyVKCallbackAPI(self)
      self.streamingAPI = new EasyVKStreamingAPI(self)
      self.widgets = new EasyVKWidgets(self)
      self.bots = {}
      self.bots.longpoll = new EasyVKBotsLongPoll(self)

      // Here is a middlewares will be saved
      self.middleWares = [async (data) => {
        let next = data.next
        data.next = undefined
        await next(data)
      }]

      self._middlewaresController = new EasyVKMiddlewares(self)

      // http module for http requests from cookies and jar session
      self.http = new EasyVKHttp(self)

      // Re init all cases
      self.session = new EasyVKSession(self, self.session)

      Object.defineProperty(self, 'helpers', {
        get: () => {
          throw self._error('method_deprecated', {
            from: '1.3.0',
            method: 'helpers'
          })
        }
      })

      if (params.save_session) self.session.save()

      return resolve(s)
    }
  }

  async post (methodName, data, other) {
    let self = this

    return new Promise((resolve, reject) => {
      return self.call(methodName, data, 'post', other).then(resolve, reject)
    })
  }

  /**
 *
 *Function for calling to methods and get anything form VKontakte API
 *See more: https://vk.com/dev/methods
 *
 *@param {String} methodName - Is just a method name which you need to call and get data,
 *  for example: "messages.send", "users.get"
 *@param {Object} [data={}] - Is data object for query params, it will be serialized from object to uri string.
 *  If vk.com asks a parameters, you can send they.
 *  (Send access_token to this from session is not necessary, but also you can do this)
 *@param {String} [methodType=get] - Is type for query, ["post", "delete", "get", "put"]
 *
 *  @return {Promise}
 *  @promise Call to a method, send request for VKontakte API
 *  @resolve {Object} - Standard object like {vk: EasyVK, vkr: Response}
 *  @reject {Error} - vk.com error response or request module error
     *
 */

  async call (methodName, data = {}, methodType = 'get', other = {}) {
    let self = this

    let {
      middleWare
    } = other

    return new Promise((resolve, reject) => {
      async function reCall (_needSolve, _resolverReCall, _rejecterReCall) {
        methodType = String(methodType).toLowerCase()

        if (methodType !== 'get' || methodType !== 'post') {
          methodType = 'get'
        }

        if (!staticMethods.isObject(data)) reject(new Error('Data must be an object'))
        if (!data.access_token) data.access_token = self.session.access_token
        if (!data.v) data.v = self.params.api_v

        if (!data.captcha_sid && self.params.captcha_sid) data.captcha_sid = self.params.captcha_sid
        if (!data.captcha_key && self.params.captcha_key) data.captcha_key = self.params.captcha_key

        if (!data.lang && self.params.lang && self.params.lang !== 'undefined') {
          data.lang = self.params.lang
        }

        if (middleWare && typeof middleWare === 'function') {
          data = await middleWare(data)
        }

        let thread = {
          methodType,
          method: methodName,
          query: data,
          _needSolve
        }

        let FromMiddleWare = await self._middlewaresController.run(thread)

        methodName = FromMiddleWare.method
        methodType = FromMiddleWare.methodType

        data = FromMiddleWare.query

        return staticMethods.call(methodName, data, methodType, self.debugger, self.agent).then((vkr) => {
          if (_needSolve) {
            try {
              _resolverReCall(true)
            } catch (e) {}
          }

          return resolve({
            vkr: vkr,
            vk: self
          })
        }).catch((err) => {
          try {
            let vkr = JSON.parse(err.message)

            if (vkr.error === 'need_captcha' || vkr.error.error_code === 14) {
              if (_needSolve) {
                try {
                  _rejecterReCall({
                    error: false,
                    reCall: () => {
                      return reCall()
                    }
                  })
                } catch (e) {}

                return
              }

              // Captcha error, handle it
              const captchaSid = vkr.error.captcha_sid || vkr.captcha_sid
              const captchaImg = vkr.error.captcha_img || vkr.captcha_img
              let paramsForHandler = { captcha_sid: captchaSid, captcha_img: captchaImg, vk: self, params: data }

              paramsForHandler.resolve = (captchaKey) => {
                return new Promise((resolve, reject) => {
                  data.captcha_key = captchaKey
                  data.captcha_sid = captchaSid

                  try {
                    reCall('NEED SOLVE', resolve, reject)
                  } catch (errorRecall) { /* Need pass it */ }
                })
              }

              self.captchaHandler(paramsForHandler)
            } else {
              reject(err)
            }
          } catch (e) {
            reject(err)
          }
        })
      }

      reCall()
    })
  }

  /**
 *
 *  This function saves your session chnages to a params.sessionf_file file
 *
 *  @deprecated
 *  @return EasyVK
 *
 */

  saveSession () {
    let self = this

    throw self._error('method_deprecated', {
      from: '1.2',
      method: 'saveSession'
    })
  }

  // Ony for mer
  _error (...args) {
    let self = this
    return self._errors.error(...args)
  }
}

function is (obj1, obj2) {
  return Object.getPrototypeOf(obj1).constructor.name === obj2
}

module.exports = EasyVK
module.exports.is = is
module.exports.class = {
  VKResponse: 'VKResponse',
  VKResponseError: 'VKResponseError',
  EasyVKError: 'EasyVKError',
  AudioItem: 'AudioItem'
}

module.exports.version = '2.2.0'
module.exports.callbackAPI = new EasyVKCallbackAPI({})
module.exports.streamingAPI = new EasyVKStreamingAPI({})
