'use strict'

const https = require('https')
const request = require('request')
const querystring = require('querystring')
const VKResponse = require('./VKResponse.js')
const configuration = require('./configuration.js')
const VKResponseError = require('./VKResponseError.js')

class StaticMethods {
  constructor (settings = {}) {
    this.settings = settings
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
      vkr = JSON.parse(vkr)

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
          return new VKResponseError(vkr.error_description, vkr.error)
        }
      }
    } catch (e) {
      return e
    }
  }

  static async call (methodName, data = {}, methodType = 'get', debuggerIS = null, Agent, settings = {}) {
    let self = this

    return new Promise((resolve, reject) => {
      let req
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

        callParams.form = data
        callParams.headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-agent': settings.userAgent
        }

        // Nice request recommendtion
        for (let i in callParams.form) {
          if (self.isObject(callParams.form[i])) { callParams.form[i] = JSON.stringify(callParams.form[i]) }
        }

        req = request.post
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
        return https.get(options, (res) => {
          let vkr = ''
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
        req(callParams, (err, res) => {
          if (err) { return reject(new Error(err)) }
          return parseResponse(res.body)
        })
      }

      async function parseResponse (vkr) {
        if (vkr) {
          if (debuggerIS) {
            try {
              debuggerIS.push('response', vkr)
            } catch (e) {}
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

  async call () {
    return StaticMethods.call(...arguments, this.settings)
  }
}

module.exports = StaticMethods
