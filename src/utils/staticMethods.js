'use strict'

const https = require('https')
const querystring = require('querystring')
const VKResponse = require('./VKResponse.js')
const configuration = require('./configuration.js')
const VKResponseError = require('./VKResponseError.js')
const Debugger = require('./debugger.class.js')
const qs = require('qs')
const fetch = require('node-fetch')

class StaticMethods {
  constructor (settings = {}, evkParams = {}) {
    this.params = evkParams
    this.settings = settings

    if (evkParams.mode.name === 'highload') {
      this._requests = {}
      this.canComplete = true

      evkParams.mode.timeout = Number(evkParams.mode.timeout)

      if (!evkParams.mode.timeout) {
        evkParams.mode.timeout = 15
      }
    }
  }

  static createExecute (method = '', params = {}) {
    params.v = undefined
    params.lang = undefined
    return `API.${method}(${JSON.stringify(params)})`
  }

  static isString (n) {
    return Object.prototype.toString.call(n) === '[object String]'
  }

  static isObject (n) {
    return Object.prototype.toString.call(n) === '[object Object]'
  }

  static checkJSONErrors (vkr, reject) {
    let self = this

    try {
      vkr = Object.prototype.toString.call(vkr) === '[object Object]' ? vkr : JSON.parse(vkr)

      let err = self.checkErrors(vkr)

      if (err) {
        if (typeof err === 'string') {
          // new error
          err = new Error(err)
        }

        reject(err)
        return false
      }

      return VKResponse(self, vkr)
    } catch (e) {
      if (e.name === 'SyntaxError') {
        let err = new Error('Server sent not a json object (' + vkr + ')')

        return reject(err)
      }

      return reject(new Error(e))
    }
  }

  static urlencode (object = {}) {
    let self = this

    return Object.keys(object)
      .map(prop =>
        prop + '=' + (
          (self.isObject(object[prop]))
            ? (encodeURIComponent(JSON.stringify(object[prop]))) : encodeURIComponent(object[prop])
        )
      )
      .join('&')
  }

  static checkErrors (vkr) {
    try {
      if (vkr.error) {
        if (vkr.error === 'need_captcha' || vkr.error.error_code === 14) {
          return JSON.stringify(vkr)
        } else if (vkr.error === 'need_validation') {
          if (vkr.ban_info) {
            return vkr.error_description
          } else {
            let type = 'sms'

            if (vkr.validation_type.match('app')) {
              type = 'app'
            }

            return {
              error: `Please, enter your ${type} code in code parameter!`,
              error_code: vkr.error,
              validation_type: vkr.validation_type,
              validation_sid: vkr.validation_sid,
              redirect_uri: vkr.redirect_uri
            }
          }
        } else if (vkr.error.error_code === 17) {
          return {
            redirect_uri: vkr.error.redirect_uri,
            error: vkr.error.error_msg,
            error_code: vkr.error.error_code
          }
        }

        if (vkr.error.error_msg) {
          return new VKResponseError(vkr.error.error_msg, vkr.error.error_code, vkr.error.request_params)
        } else if (vkr.error.message) {
          return new VKResponseError(vkr.error.message, vkr.error.code, vkr.error.params)
        } else {
          return new VKResponseError(vkr.error_description ? vkr.error_description : vkr.error, vkr.error_code ? vkr.error_code : vkr.error)
        }
      }
    } catch (e) {
      return e
    }
  }

  static async call (methodName, data = {}, methodType = 'get', debuggerIS = null, Agent, settings = {}) {
    let self = this

    return new Promise((resolve, reject) => {
      let methodTypeLower = methodType.toString().toLocaleLowerCase()

      if (methodTypeLower !== 'post') {
        methodType = 'get'
      }

      if (!methodName) {
        return reject(new Error('Put method name in your call request!'))
      }

      if (!data.v) {
        data.v = configuration.api_v
      }

      if (!settings.userAgent) {
        settings.userAgent = configuration.DEFAULT_USER_AGENT
      }

      let callParams = {
        url: configuration.BASE_CALL_URL + methodName
      }

      let data2 = Object.assign({}, data)

      if (methodType === 'post') {
        // prepare post request
        callParams.agent = Agent

        callParams.body = qs.stringify(data)
        callParams.headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-agent': settings.userAgent
        }

        if (settings.debug) {
          settings.debug(Debugger.EVENT_REQUEST_TYPE, {
            url: callParams.url,
            method: 'POST',
            query: data,
            section: 'vk.call'
          })
        }
      }

      if (debuggerIS) {
        try {
          debuggerIS.push('fullRequest', callParams)
        } catch (e) {
          return reject(new Error('No have a complite debuggerIS'))
        }
      }

      if (methodType === 'get') {
        data = querystring.stringify(data)

        let options = {
          host: 'api.' + configuration.BASE_DOMAIN,
          agent: Agent,
          path: '/method/' + methodName + '?' + data,
          headers: {
            'User-Agent': settings.userAgent
          }
        }

        if (settings.debug) {
          settings.debug(Debugger.EVENT_REQUEST_TYPE, {
            url: 'https://' + options.host + options.path,
            method: 'GET',
            query: data,
            section: 'vk.call'
          })
        }

        return https.get(options, (res) => {
          let vkr = ''
          res.setEncoding('utf8')
          res.on('data', (chu) => {
            vkr += chu
          })
          res.on('end', () => { return parseResponse(vkr) })
        }).on('error', (e) => {
          try {
            reject(e)
          } catch (err) {
            throw e
          }
        })
      } else {
        callParams.method = 'POST'
        fetch(callParams.url, callParams).then(async (res) => {
          res = await res.json()
          return parseResponse(res)
        }).catch(e => reject(e))
      }

      async function parseResponse (vkr) {
        if (vkr) {
          if (debuggerIS) {
            try {
              debuggerIS.push('response', vkr)
            } catch (e) {}
          }

          if (settings.debug) {
            settings.debug(Debugger.EVENT_RESPONSE_TYPE, {
              body: vkr,
              section: 'vk.call'
            })
          }

          let json = self.checkJSONErrors(vkr, reject)

          if (json) {
            json.queryData = data2

            return resolve(json)
          } else {
            return reject(new Error("JSON is not valid... oor i don't know"))
          }
        } else {
          return reject(new Error(`Empty response ${vkr}`))
        }
      }
    })
  }

  static randomId (peerId = 0) {
    return parseInt(new Date().getTime() + '' + peerId + '' + Math.floor(Math.random() * 10000), 10)
  }

  async _completeExecute (token = '', Agent, settings) {
    if (!token) throw new Error('Unused token')

    let requests = this._requests[token]

    if (!requests.stack) throw new Error('Unknow error')

    let execCode
    let execs = []
    let execsData = []
    let stack = [...requests.stack]

    requests.stack = []
    this.canComplete = true

    stack.forEach((requestExec) => {
      execs.push(requestExec.exec)
      execsData.push(requestExec.data)
    })

    execCode = `return [${execs.join(',')}];`

    let data = {
      access_token: token,
      v: this.params.api_v,
      code: execCode
    }

    if (this.params.lang !== 'undefined') data.lang = this.params.lang
    StaticMethods.call('execute', data, 'post', null, Agent, settings).then((vkr) => {
      let vkrFull = vkr.getFullResponse()
      vkr.forEach((val, i) => {
        let req = stack[i]

        if (val === false) {
          if (vkrFull.execute_errors) {
            let err = vkrFull.execute_errors[i]
            if (err && execs[i].match(err.method)) { // "API.messages.send()".match("messages.send")
              err = new VKResponseError(err.error_msg, err.error_code, execsData[i].data)
              return req.reject(err)
            }
          }

          let err = new Error('Error occured in execute method')

          err.response = val
          err.request = req
          req.reject(err)
        } else {
          let vkr = VKResponse(StaticMethods, val)
          req.resolve(vkr)
        }
      })
    }).catch(err => {
      let req = stack[stack.length - 1]

      err.highload = {
        stack,
        settings,
        data
      }

      req.reject(err)
    })
  }

  async initHighLoadRequest (method, data, type, debuggerIS, Agent) {
    let self = this

    return new Promise((resolve, reject) => {
      // disable custom version and language in execute methods
      data.v = undefined
      data.lang = undefined

      data = JSON.parse(JSON.stringify(data))

      let accessToken = data.access_token
      data.access_token = undefined

      let requests = self._requests[accessToken]

      if (!requests) {
        requests = self._requests[accessToken] = {
          stack: [],
          timeoutId: 0
        }
      }

      if (requests.timeoutId) {
        clearTimeout(requests.timeoutId)
      }

      requests.stack.push({
        exec: self.createExecute(method, data),
        data: {
          method: method,
          data: data,
          token: accessToken
        },
        resolve,
        reject
      })

      function complete () {
        if (self.canComplete) {
          self.canComplete = false
          self._completeExecute(accessToken, Agent, self.settings)
        }
      }

      if (requests.stack.length === 25) {
        complete()
        return
      }

      requests.timeoutId = setTimeout(function () {
        complete()
      }, self.params.mode.timeout)
    })
  }

  createExecute () {
    return StaticMethods.createExecute(...arguments)
  }

  async call () {
    if (this.params.mode.name === 'highload' && arguments[0] !== 'execute') {
      return this.initHighLoadRequest(...arguments)
    }

    return StaticMethods.call(...arguments, this.settings)
  }
}

module.exports = StaticMethods
