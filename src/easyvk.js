import fetch from 'node-fetch'

import { URL } from 'url'
import fs from 'fs'

// Modules
import StaticMethods from './utils/staticMethods.js'
import EasyVKUploader from './utils/uploader.js'
import EasyVKLongPoll from './utils/longpoll.js'
import EasyVKCallbackAPI from './utils/callbackapi.js'
import EasyVKStreamingAPI from './utils/streamingapi.js'
import EasyVKWidgets from './utils/widgets.js'
import configuration from './utils/configuration.js'
import EasyVKRequestsDebugger from './utils/debugger.js'
import EasyVKBotsLongPoll from './utils/botslongpoll.js'
import EasyVKSession from './utils/session.js'
import EasyVKHttp from './utils/http.js'
import easyVKErrors from './utils/easyvkErrors.js'
import EasyVKMiddlewares from './utils/middlewares.js'
import { EVENT_REQUEST_TYPE, EVENT_RESPONSE_TYPE } from './utils/debugger.class.js'

import ProxyAgent from 'proxy-agent'

import https from 'https'

export const authTypes = ['user', 'group', 'app']

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
        this.params.debug.emit(t, d)
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

        if (options.username || options.password) {
          options.auth = options.username + ':' + options.password
        }

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
        lang: params.lang === 'undefined' ? 'ru' : params.lang,
        '2fa_supported': 1
      }

      if (params.captcha_key) {
        defaultDataParams.captcha_sid = params.captcha_sid
        defaultDataParams.captcha_key = params.captcha_key
      }

      if (params.code && params.code.toString().length !== 0) {
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
          if (self.params.authType) {
            let { authType } = self.params
            if (authType === authTypes[0]) {
              initToken()
            } else if (authType === authTypes[1]) {
              groupToken()
            } else if (authType === authTypes[2]) {
              appToken()
            } else {
              initToken()
            }
          } else {
            initToken()
          }
        } else if (params.username) {
          // Try get access_token with auth
          let getData = {
            username: params.username,
            password: params.password,
            grant_type: 'password',
            device_id: '',
            libverify_support: 1,
            scope: 'all',
            v: '5.122'
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

          self.debug(EVENT_REQUEST_TYPE, {
            url: url,
            query: getData,
            method: 'GET'
          })

          fetch(url, {
            agent: self.agent,
            headers: headers
          }).then(async (res) => {
            if (res.statusText.match(/proxy/gi)) {
              let e = new Error('Invalid response body: no OK statusText (maybe troubles with proxy)')
              e.type = 'invalid-json'
              return reject(e)
            }

            self.debug(EVENT_RESPONSE_TYPE, { body: res })

            if (self.debuggerRun) {
              try {
                self.debuggerRun.push('response', res)
              } catch (e) {
                return reject(new Error('DebuggerRun is not setuped correctly'))
              }
            }

            res = await res.json()
            return completeSession(null, res, {
              credentials_flow: 1,
              client_id: params.client_id
            }).catch((e) => {
              if (params.onlyInstance) {
                self.session = new EasyVKSession(self, {
                  access_token: null
                })

                initResolve(self)
              } else {
                return reject(e)
              }
            })
          }).catch(e => { console.error(e); reject(e) })
        }
      }

      async function makeAuth (_needSolve, _resolverReCall, _rejecterReCall, getData) {
        let queryData = prepareRequest(getData)
        let url = configuration.BASE_OAUTH_URL + 'token/?' + queryData

        self.debug(EVENT_REQUEST_TYPE, {
          url: url,
          query: queryData,
          method: 'GET'
        })

        return fetch(url, {
          headers: {
            'User-Agent': params.userAgent
          },
          agent: self.agent
        }).then(async res => {
          if (res.statusText.match(/proxy/gi)) {
            let e = new Error('Invalid response body: no OK statusText (maybe troubles with proxy)')
            e.type = 'invalid-json'
            return reject(e)
          }

          res = await res.text()

          self.debug(EVENT_RESPONSE_TYPE, { body: res })

          if (self.debuggerRun) {
            try {
              self.debuggerRun.push('response', res)
            } catch (e) {
              return reject(new Error('DebuggerRun is not setuped correctly'))
            }
          }

          try {
            res = JSON.parse(res)
          } catch (e) {
            let _e = new Error('Invalid json sent')
            _e.type = 'invalid-json'
            return reject(_e)
          }

          return completeSession(null, res, {
            user_id: null
          }).catch(async (err) => {
            try {
              self._catchCaptcha({ err,
                reCall: () => {
                  return makeAuth(0, 0, 0, getData)
                },
                _needSolve,
                _resolverReCall,
                _rejecterReCall,
                data: getData,
                reject })
            } catch (e) {
              if (err.validation_sid && err.validation_type && String(err.validation_type).match('sms')) {
                let validatePhoneData = {
                  https: 1,
                  lang: defaultDataParams.lang,
                  v: defaultDataParams.v,
                  client_id: defaultDataParams.client_id,
                  client_secret: defaultDataParams.client_secret,
                  api_id: 2274003,
                  libverify_support: 1,
                  sid: err.validation_sid
                }
                await StaticMethods.call('auth.validatePhone', validatePhoneData, 'post', self.debuggerRun, self.agent)
                  .catch(e => {})
              }

              reject(err)
            }
          })
        }).catch(e => {
          console.error(e)
          reject(e)
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

        return res
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

            let url = configuration.BASE_CALL_URL + 'users.get?' + prepareRequest(getData)

            self.debug(EVENT_REQUEST_TYPE, {
              url: url + '?' + StaticMethods.urlencode(getData),
              query: getData,
              method: 'GET'
            })

            return fetch(url, {
              agent: self.agent,
              headers: {
                'User-agent': params.userAgent
              }
            }).then(async (res) => {
              if (res.statusText.match(/proxy/gi)) {
                let e = new Error('Invalid response body: no OK statusText (maybe troubles with proxy)')
                e.type = 'invalid-json'
                return reject(e)
              }

              self.debug(EVENT_RESPONSE_TYPE, { body: res })

              if (self.debuggerRun) {
                try {
                  self.debuggerRun.push('response', res)
                } catch (e) {
                  return reject(new Error('DebuggerRun is not setuped correctly'))
                }
              }

              res = await res.json()

              let vkr = prepareResponse(null, res)

              if (vkr) {
                let json = StaticMethods.checkJSONErrors(vkr, reject)
                if (json) {
                  if (Array.isArray(json) && json.length === 0) {
                    session = {
                      access_token: session.access_token
                    }

                    if (self.params.authType && self.params.authType === authTypes[0]) {
                      return reject(new Error('Is not a user token! Or this token is not valid (expired)'))
                    } else {
                      appToken()
                    }
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
            }).catch(e => reject(e))
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

        getData = data

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('request', configuration.BASE_CALL_URL + 'apps.get?' + StaticMethods.urlencode(data))
          } catch (e) {
            // Ignore
          }
        }

        let url = configuration.BASE_CALL_URL + 'apps.get?' + prepareRequest(getData)

        self.debug(EVENT_REQUEST_TYPE, {
          url,
          query: getData,
          method: 'GET'
        })

        fetch(url, {
          agent: self.agent,
          headers: {
            'User-Agent': params.userAgent
          }
        }).then(async (res) => {
          if (res.statusText.match(/proxy/gi)) {
            let e = new Error('Invalid response body: no OK statusText (maybe troubles with proxy)')
            e.type = 'invalid-json'
            return reject(e)
          }

          let vkr = await res.json()
          if (self.debuggerRun) {
            try {
              self.debuggerRun.push('response', vkr)
            } catch (e) {
              // Ignore
            }
          }

          self.debug(EVENT_RESPONSE_TYPE, { body: vkr })

          if (vkr) {
            let json

            json = StaticMethods.checkJSONErrors(vkr, (e) => {
              if (e.error_code === 5 || e.error_code === 27 || e.error_code === 28) {
                if (self.params.authType && self.params.authType === authTypes[2]) {
                  return reject(new Error('Is not an application token! Or this token is not valid (expired)'))
                } else {
                  groupToken()
                }
              } else {
                reject(e)
              }
            })

            if (json) {
              json = json.items[0]

              if (Array.isArray(json) && json.length === 0) {
                if (self.params.authType && self.params.authType === authTypes[2]) {
                  return reject(new Error('Is not an application token! Or this token is not valid (expired)'))
                } else {
                  groupToken()
                }
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
        }).catch(e => reject(e))
      }

      function groupToken () {
        let getData

        getData = {
          access_token: params.access_token,
          v: params.api_v,
          lang: params.lang || 'ru',
          fields: params.fields.join(',')
        }

        if (self.debuggerRun) {
          try {
            self.debuggerRun.push('request', configuration.BASE_CALL_URL + 'groups.getById?' + StaticMethods.urlencode(getData))
          } catch (e) {
            // Ignore
          }
        }

        let url = configuration.BASE_CALL_URL + 'groups.getById?' + prepareRequest(getData)

        self.debug(EVENT_REQUEST_TYPE, {
          url,
          query: getData,
          method: 'GET'
        })

        fetch(url, {
          agent: self.agent,
          headers: {
            'User-Agent': params.userAgent
          }
        }).then(async (res) => {
          if (res.statusText.match(/proxy/gi)) {
            let e = new Error('Invalid response body: no OK statusText (maybe troubles with proxy)')
            e.type = 'invalid-json'
            return reject(e)
          }

          let vkr = await res.json()

          if (self.debuggerRun) {
            try {
              self.debuggerRun.push('response', vkr)
            } catch (e) {
              // Ignore
            }
          }

          self.debug(EVENT_RESPONSE_TYPE, { body: vkr })

          if (vkr) {
            let json = StaticMethods.checkJSONErrors(vkr, (e) => {
              if ((e.error_code === 100 || e.error_code === 5) && self.params.authType && self.params.authType === authTypes[1]) {
                return reject(new Error('Is not a group token! Or this token is not valid (expired)'))
              } else {
                return reject(new Error('EasyVK can not recognize this token authentication type'))
              }
            })

            if (json) {
              if (Array.isArray(json) && json.length === 0) {
                return reject(self._error('access_token_not_valid'))
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
        }).catch(e => reject(e))
      }

      function getConnectedUtil (UtilObject) {
        if (typeof UtilObject === 'function') return new UtilObject(self)
        return UtilObject
      }

      function connectUtil (prop, util, connectBool) {
        if (connectBool === undefined) {
          connectBool = params.utils[prop] !== false
        }
        if (connectBool) {
          if (Array.isArray(util)) {
            let utilsWrapper = {}

            util.forEach(util => {
              utilsWrapper[util[0]] = getConnectedUtil(util[1])
            })

            Object.defineProperty(self, prop, { value: utilsWrapper })
          } else {
            Object.defineProperty(self, prop, { value: getConnectedUtil(util) })
          }
        } else {
          Object.defineProperty(self, prop, {
            get: () => {
              throw new Error(`This util not connected. Make params.utils[${prop}] = true in easyvk options`)
            }
          })
        }
      }

      function initResolve (s) {
        if (params.clear) {
          fs.writeFileSync(params.session_file, '{}')
        }

        let httpConnetBool = (params.utils.http !== false && self.session.user_id) || params.utils.http === true
        let botsConnectBool = (params.utils.bots !== false && (self.session.group_id || self.session.user_id)) || params.utils.bots === true
        let longpollConnectBool = (params.utils.longpoll !== false && (self.session.user_id)) || params.utils.longpoll === true

        connectUtil('uploader', EasyVKUploader)
        connectUtil('widgets', EasyVKWidgets)
        connectUtil('streamingAPI', EasyVKStreamingAPI)
        connectUtil('callbackAPI', EasyVKCallbackAPI)
        connectUtil('http', EasyVKHttp, httpConnetBool)
        connectUtil('longpoll', EasyVKLongPoll, longpollConnectBool)

        connectUtil('bots', [
          ['longpoll', EasyVKBotsLongPoll],
          ['cb', self.callbackAPI ? self.callbackAPI : EasyVKCallbackAPI]
        ], botsConnectBool)

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
 *  @reject {Error} - vk.com error response or node-fetch module error
     *
 */

  async call (methodName, data = {}, methodType = 'get', other = {}) {
    let self = this

    let {
      middleWare
    } = other

    let highloadStack = null

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
          data.lang = self.params.lang || 'ru'
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

        return self._static.call(methodName, data, methodType, self._debugger, self.agent, {
          signal: other.signal,
          userAgent: self.params.userAgent
        }).then((vkr) => {
          if (_needSolve) {
            try {
              _resolverReCall(true)
            } catch (e) {}
          }

          if (highloadStack) {
            highloadStack.forEach((stack, i) => {
              if (i === highloadStack.length - 1) { return resolve(vkr) }
              return stack.resolve(vkr)
            })
          } else {
            return resolve(vkr)
          }
        }).catch((err) => {
          try {
            if (err.highload) {
              data = {
                access_token: err.highload.token || self.params.access_token,
                ...(err.highload.data)
              }

              highloadStack = err.highload.stack

              methodName = 'execute'
            }

            self._catchCaptcha({
              err,
              reCall,
              _needSolve,
              _resolverReCall,
              _rejecterReCall,
              data,
              reject
            })
          } catch (e) {
            if (highloadStack) {
              highloadStack.forEach((stack, i) => {
                if (i === highloadStack.length - 1) { return reject(err) }
                return stack.reject(err)
              })
            } else {
              reject(err)
            }
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

export const is = (obj1, obj2) => Object.getPrototypeOf(obj1).constructor.name === obj2

export const classes = {
  VKResponse: 'VKResponse',
  VKResponseError: 'VKResponseError',
  EasyVKError: 'EasyVKError'
}

export const version = '2.8.2'
export const callbackAPI = new EasyVKCallbackAPI({})
export const streamingAPI = new EasyVKStreamingAPI({})

export default EasyVK
