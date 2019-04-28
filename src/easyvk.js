const request = require('request')
const { URL } = require('url')
const fs = require('fs')

// Modules

const StaticMethods = require('./utils/staticMethods.js')
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
const DebuggerClass = require('./utils/debugger.class.js')

const ProxyAgent = require('proxy-agent')

const https = require('https')

/**
 *  EasyVK module. In this module creates session by your params
 *  And then you will get a EasyVK object (Session creates in the easyvkInit.js file)
 *  Author: @ciricc
 *  License: MIT
 *
 */

class EasyVK {
  // Here will be created session
  constructor (params, debuggerRun) {
    this.params = params

    this._debugger = new EasyVKRequestsDebugger(this)

    this.debug = (t, d) => {
      if (this.params.debug) {
        this.params.debug.emit(DebuggerClass._toRaw(t), d)
      }
    }

    this.debuggerRun = debuggerRun || this._debugger

    this._errors = easyVKErrors

    this._errors.setLang(params.lang)
  }

  get debugger () {
    console.warn('[Deprecated property warning] \nvk.debugger property will be deprecated in next releases. Please, use new easyvk.Debugger() and set it up in the easyvk configuration like params.debug = myDebugger')
    return this._debugger
  }

  set debugger (d) {
    this._debugger = d
  }

  async _init () {
    let self = this
    return new Promise((resolve, reject) => {
      let session, params

      session = {}
      params = self.params

      if (params.proxy) {
        let options = new URL(params.proxy)
        let opts = {}

        for (let i in options) {
          opts[i] = options[i]
        }

        options = opts

        options.keepAlive = true
        options.keepAliveMsecs = 30000

        self.agent = new ProxyAgent(options, true)
      } else {
        self.agent = new https.Agent({
          keepAlive: true,
          keepAliveMsecs: 30000
        })
      }

      let defaultDataParams = {
        client_id: params.client_id || configuration.WINDOWS_CLIENT_ID,
        client_secret: params.client_secret || configuration.WINDOWS_CLIENT_SECRET,
        v: params.api_v,
        lang: params.lang || 'ru'
      }

      if (params.captcha_key) {
        defaultDataParams.captcha_sid = params.captcha_sid
        defaultDataParams.captcha_key = params.captcha_key
      }

      if (params.code && params.code.toString().length !== 0) {
        defaultDataParams['2fa_supported'] = 1
        defaultDataParams.code = params.code
      }

      if (!params.captchaHandler || !Object.prototype.toString.call(params.captchaHandler).match(/Function/)) {
        params.captchaHandler = (thread) => {
          throw self._error('captcha_error', {
            captcha_key: thread.captcha_key,
            captcha_sid: thread.captcha_sid,
            captcha_img: thread.captcha_img
          })
        }
      }

      self.captchaHandler = params.captchaHandler

      /* if user wants to get data from file, need get data from file
         or generate this file automatically with new data */

      if (!params.reauth) {
        let data

        try {
          data = fs.readFileSync(params.session_file)
        } catch (e) {
          data = false
        }

        if (data) {
          try {
            data = JSON.parse(data.toString())

            if (
              (data.access_token && data.access_token === params.access_token) || // If config token is session token
              (params.username && params.username === data.username) ||
              (params.client_id && params.client_id === data.client_id && !params.access_token && !params.username)// or if login given, it need be same
            ) {
              if (data.access_token) {
                session = new EasyVKSession(self, data)
                self.session = session
                return initResolve(self)
              } else {
                if (!(params.username && params.password) && !params.access_token && !params.client_id && params.client_secret) {
                  return reject(self._error('empty_session'))
                }
              }
            }
          } catch (e) {
            if (!(params.username && params.password) && !params.access_token) {
              return reject(self._error('session_not_valid'))
            }
          }
        } else {
          if (!(params.username && params.password) && !params.access_token && !(params.client_id && params.client_secret)) {
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
            grant_type: 'password',
            device_id: '',
            libverify_support: 1
          }

          makeAuth(0, 0, 0, getData) // пиздец
        } else if (params.client_id) {
          let getData = {
            grant_type: 'client_credentials'
          }

          getData = prepareRequest(getData)

          let url = configuration.BASE_OAUTH_URL + 'token/?' + getData
          let headers = {
            'User-Agent': params.userAgent
          }

          self.debug(DebuggerClass.EVENT_REQUEST_TYPE, {
            url: url,
            query: getData,
            method: 'GET'
          })

          request.get({
            url,
            agent: self.agent,
            headers: headers
          }, (err, res) => {
            completeSession(err, res, {
              credentials_flow: 1,
              client_id: params.client_id
            }).catch(reject)
          })
        }
      }

      async function makeAuth (_needSolve, _resolverReCall, _rejecterReCall, getData) {
        let queryData = prepareRequest(getData)
        let url = configuration.BASE_OAUTH_URL + 'token/?' + queryData

        self.debug(DebuggerClass.EVENT_REQUEST_TYPE, {
          url: url,
          query: queryData,
          method: 'GET'
        })

        request.get({
          url,
          headers: {
            'User-Agent': params.userAgent
          },
          agent: self.agent
        }, (err, res) => {
          completeSession(err, res, {
            user_id: null
          }).catch((err) => {
            try {
              self._catchCaptcha({ err, reCall: makeAuth, _needSolve, _resolverReCall, _rejecterReCall, data: getData, reject })
            } catch (e) {
              reject(err)
            }
          })
        })
      }

      function completeSession (err, res, object = {}) {
        return new Promise((resolve, reject) => {
          let vkr = prepareResponse(err, res)
          let json = generateSessionFromResponse(vkr, reject)

          if (json) {
            session = json
            Object.assign(session, object)
            initToken()
            resolve(true)
          } else {
            return reject(self._error('empty_response', {
              response: vkr
            }))
          }
        })
      }

      function generateSessionFromResponse (vkr, rej) {
        let json = StaticMethods.checkJSONErrors(vkr, rej || reject)

        if (json) {
          json = JSON.parse(JSON.stringify(json))
          json.user_id = null

          return json
        }
      }

      function prepareRequest (getDataObject = {}) {
        let Obj = Object.assign(getDataObject, defaultDataParams)

        Obj = StaticMethods.urlencode(Obj)

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('request', configuration.BASE_OAUTH_URL + 'token/?' + Obj)
          } catch (e) {
            return reject(new Error('DebuggerRun is not setuped correctly'))
          }
        }

        return Obj
      }

      function prepareResponse (err, res) {
        if (err) {
          return reject(new Error(err))
        }

        let vkr = res.body

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('response', vkr)
          } catch (e) {
            return reject(new Error('DebuggerRun is not setuped correctly'))
          }
        }

        self.debug(DebuggerClass.EVENT_RESPONSE_TYPE, { body: vkr })

        return vkr
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

            getData = StaticMethods.urlencode(getData)
            let url = configuration.BASE_CALL_URL + 'users.get?' + getData

            self.debug(DebuggerClass.EVENT_REQUEST_TYPE, {
              url,
              query: getData,
              method: 'GET'
            })

            request.get({
              url,
              agent: self.agent,
              headers: {
                'User-agent': params.userAgent
              }
            }, (err, res) => {
              let vkr = prepareResponse(err, res)

              if (vkr) {
                let json = StaticMethods.checkJSONErrors(vkr, reject)
                if (json) {
                  if (Array.isArray(json) && json.length === 0) {
                    session = {
                      access_token: session.access_token
                    }

                    appToken()
                  } else {
                    session = {
                      access_token: session.access_token
                    }

                    session.user_id = json[0].id
                    session.first_name = json[0].first_name
                    session.last_name = json[0].last_name
                    session.username = params.username

                    for (let i = 0; i < params.fields.length; i++) {
                      if (json[0][params.fields[i]] && session[params.fields[i]] === undefined) {
                        session[params.fields[i]] = json[0][params.fields[i]]
                      }
                    }

                    self.session = new EasyVKSession(self, session)

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

        let data = {
          access_token: params.access_token,
          v: params.api_v,
          fields: params.fields.join(',')
        }

        if (params.lang !== undefined) data.lang = params.lang

        getData = StaticMethods.urlencode(data)

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('request', configuration.BASE_CALL_URL + 'apps.get?' + getData)
          } catch (e) {
            // Ignore
          }
        }

        let url = configuration.BASE_CALL_URL + 'apps.get?' + getData

        self.debug(DebuggerClass.EVENT_REQUEST_TYPE, {
          url,
          query: getData,
          method: 'GET'
        })

        request.get({
          url,
          agent: self.agent,
          headers: {
            'User-Agent': params.userAgent
          }
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

          self.debug(DebuggerClass.EVENT_RESPONSE_TYPE, { body: vkr })

          if (vkr) {
            let json

            json = StaticMethods.checkJSONErrors(vkr, (e) => {
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

                self.session = new EasyVKSession(self, session)

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

        getData = StaticMethods.urlencode({
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

        let url = configuration.BASE_CALL_URL + 'groups.getById?' + getData

        self.debug(DebuggerClass.EVENT_REQUEST_TYPE, {
          url,
          query: getData,
          method: 'GET'
        })

        request.get({
          url,
          proxy: params.proxy,
          headers: {
            'User-Agent': params.userAgent
          }
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

          self.debug(DebuggerClass.EVENT_RESPONSE_TYPE, { body: vkr })

          if (vkr) {
            let json = StaticMethods.checkJSONErrors(vkr, reject)

            if (json) {
              if (Array.isArray(json) && json.length === 0) {
                reject(self._error('access_token_not_valid'))
              } else {
                session = {
                  access_token: session.access_token
                }

                session.group_id = json[0].id
                session.group_name = json[0].name
                session.group_screen = json[0].screen_name

                for (let i = 0; i < params.fields.length; i++) {
                  if (json[0][params.fields[i]]) {
                    session[params.fields[i]] = json[0][params.fields[i]]
                  }
                }

                self.session = new EasyVKSession(self, session)

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

        if (params.utils.uploader !== false) {
          self.uploader = new EasyVKUploader(self)
        }

        if (params.utils.widgets === false) {
          self.widgets = new EasyVKWidgets(self)
        }

        if (params.utils.streamingAPI === true) {
          self.streamingAPI = new EasyVKStreamingAPI(self)
        }

        if (params.utils.callbackAPI === true) {
          self.callbackAPI = new EasyVKCallbackAPI(self)
        }

        if ((params.utils.http !== false && self.session.user_id) || params.utils.http === true) {
          self.http = new EasyVKHttp(self)
        }

        if ((params.utils.bots !== false && (self.session.group_id || self.session.user_id)) || params.utils.bots === true) {
          self.bots = {}
          self.bots.longpoll = new EasyVKBotsLongPoll(self)
        }

        if ((params.utils.longpoll !== false && (self.session.user_id)) || params.utils.longpoll === true) {
          self.longpoll = new EasyVKLongPoll(self)
        }

        self._static = new StaticMethods({
          userAgent: params.userAgent,
          debug: self.debug
        }, self.params)

        self.config = configuration
        // Here is a middlewares will be saved
        self.middleWares = [async (data) => {
          let next = data.next
          data.next = undefined
          await next(data)
        }]

        self._middlewaresController = new EasyVKMiddlewares(self)

        // http module for http requests from cookies and jar session

        // Re init all cases
        self.session = new EasyVKSession(self, self.session)

        if (params.save_session) {
          return self.session.save().then(() => {
            return resolve(s)
          }).catch(reject)
        }

        return resolve(s)
      }
    })
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

        if (methodType !== 'post') {
          methodType = 'get'
        }

        if (!StaticMethods.isObject(data)) reject(new Error('Data must be an object'))
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

        return self._static.call(methodName, data, methodType, self._debugger, self.agent).then((vkr) => {
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
            self._catchCaptcha({ err, reCall, _needSolve, _resolverReCall, _rejecterReCall, data, reject })
          } catch (e) {
            err.fullError = e
            reject(err)
          }
        })
      }

      reCall()
    })
  }

  _catchCaptcha (params = {}) {
    let self = this

    let { err, reCall, _needSolve, _rejecterReCall, data, reject } = params

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
            reCall('NEED SOLVE', resolve, reject, data)
          } catch (errorRecall) { /* Need pass it */ }
        })
      }

      self.captchaHandler(paramsForHandler)
    } else {
      reject(err)
    }
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

module.exports.version = '2.4.12'
module.exports.callbackAPI = new EasyVKCallbackAPI({})
module.exports.streamingAPI = new EasyVKStreamingAPI({})
