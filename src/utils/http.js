/**
 *   In this file are http widgets for EasyVK
 *   You can use it
 *
 *   Author: @ciricc
 *   License: MIT
 *
 */

'use strict'

import configuration from './configuration.js'

import fs from 'fs'

import CookieStore from 'tough-cookie-file-store'
import { CookieJar, Cookie } from 'tough-cookie'

import nodeFetch from 'node-fetch'
import qs from 'qs'
import staticMethods from './staticMethods.js'
import VKResponse from './VKResponse.js'
import { EVENT_REQUEST_TYPE, EVENT_RESPONSE_TYPE } from './debugger.class.js'

import encoding from 'encoding'

class HTTPEasyVKClient {
  constructor ({ _jar, vk, httpVk, config, parser, fetch }) {
    this._config = config
    this.fetch = fetch
    this.headersRequest = {
      'User-Agent': this._config.userAgent,
      'content-type': 'application/x-www-form-urlencoded'
    }

    this.LOGIN_ERROR = 'Need login by form, use .loginByForm() method'

    this._vk = vk
    this._authjar = _jar
    this._parser = parser

    Object.defineProperty(this, 'audio', {
      get: () => {
        console.warn('[Deprecated] Audio API is fully deprecated!')
      }
    })
  }

  async post (file, form, isMobile) {
    return this.request(file, form, true, isMobile)
  }

  async get (file, form, isMobile) {
    return this.request(file, form, false, isMobile)
  }

  async fullRequest (file, form, post, isMobile, settings = {}) {
    return this.request(file, form, post, isMobile, true, settings)
  }

  async request (file, form = {}, post = true, isMobile = false, getOriginResponse = false, settings = {}) {
    let self = this
    return new Promise((resolve, reject) => {
      let mobile = ''

      if (isMobile) {
        mobile = 'm.'
      }

      let method = 'post'

      if (post !== true) method = 'get'

      let headers = {
        'user-agent': self._config.userAgent
      }

      if ((isMobile && method === 'post') || form.XML === true) {
        headers['x-requested-with'] = 'XMLHttpRequest'
      }

      headers['content-type'] = 'application/x-www-form-urlencoded'

      let url = file.match(/^http(s):\/\//) ? file : `${configuration.PROTOCOL}://${mobile}${configuration.BASE_DOMAIN}/` + file

      self._vk._debugger.push('request', {
        url,
        method,
        headers,
        form
      })

      self._vk.debug(EVENT_REQUEST_TYPE, {
        url,
        query: form,
        section: 'httpClient',
        method: method
      })

      return self.fetch(url, {
        agent: self._vk.agent,
        headers,
        method,
        body: method === 'get' ? undefined : qs.stringify(form),
        qs: method === 'get' ? form : undefined,
        ...settings
      }).then(async (res) => {
        let _origin = res

        if (getOriginResponse) {
          return resolve(_origin)
        }

        res = await res.textConverted()

        self._vk._debugger.push('response', res)

        self._vk.debug(EVENT_RESPONSE_TYPE, {
          url: url,
          query: form,
          section: 'httpClient',
          body: res
        })

        if (!res.length) {
          return reject(self._vk._error('http_client', {}, 'not_have_access'))
        }

        if (form.utf8) {
          res = encoding.convert(res, 'utf-8', 'windows-1251').toString()
        }

        if (form.retOnlyBody) return resolve(res)

        let json = self._parseResponse(res)
        if (json.payload && String(json.payload[0]) === '3') {
          await this.request('',
            {
              _origin: 'https://vk.com', // Only known in Desktop methods
              ip_h: JSON.parse(json.payload[1][0]),
              role: 'al_frame',
              to: JSON.parse(json.payload[1][1])
            }
          )
          return resolve(await this.request(...arguments))
        }

        if (form.autoParse) {
          return resolve(VKResponse(staticMethods, {
            response: json
          }))
        }

        return resolve(json)
      }).catch(err => reject(err))
    })
  }

  async goDesktop () {
    return this.request('fv?to=/mail?_fm=mail&_fm2=1', {}, false, true)
  }

  async goMobile () {
    return this.request('mail?act=show&peer=0&_ff=1', {}, false, true)
  }

  async requestMobile (...args) {
    return this.request(...args, true)
  }

  _parseResponse (e) {
    return this._parser(e)
  }

  _parseJSON (body, reject) {
    let self = this

    let json = self._parseResponse(body.split('<!>'))

    if (typeof json[6] === 'object') json[5] = json[6]

    if (typeof json[5] === 'string') {
      return reject(new Error(json[5]))
    }

    if (!json[5]) {
      return reject(self._vk._error('http_client', {}, 'not_have_access'))
    }

    json = json[5]

    return json
  }
}

class HTTPEasyVK {
  constructor (vk) {
    let self = this

    self.headersRequest = {
      'content-type': 'application/x-www-form-urlencoded'
    }

    self._vk = vk
  }

  async __checkHttpParams (params = {}) {
    return new Promise((resolve, reject) => {
      if (!params.userAgent) {
        params.userAgent = configuration['HTTP_CLIENT']['USER_AGENT']
      }

      params.userAgent = String(params.userAgent)

      if (!params.cookies) {
        params.cookies = configuration['HTTP_CLIENT']['COOKIE_PATH']
      }

      params.cookies = String(params.cookies)

      return resolve(params)
    })
  }

  _parseResponse (e, json = true) {
    if (e) {
      e = String(e).replace('<!--', '')
      if (json) {
        try {
          e = JSON.parse(e)
        } catch (_e) {
          return e
        }
      }
    }
    return e
  }

  async loginByForm (params = {}) {
    let self = this

    return new Promise((resolve, reject) => {
      let pass = params.password || self._vk.params.password
      let login = params.username || self._vk.params.username

      let captchaSid = params.captchaSid || self._vk.params.captcha_sid
      let captchaKey = params.captchaKey || self._vk.params.captcha_key
      let checkCodeUrl = params.checkCodeUrl || ''

      let code = params.code

      const captchaHandler = params.captchaHandler || self._vk.params.captchaHandler

      if (!pass || !login) return reject(self._vk._error('http_client', {}, 'need_auth'))

      self.__checkHttpParams(params).then((p) => {
        let params = p
        self._config = params

        self.headersRequest['User-Agent'] = self._config.userAgent

        let cookiepath = self._config.cookies

        if (!self._vk.params.reauth && !params.reauth) {
          let data

          if (!fs.existsSync(cookiepath)) {
            fs.closeSync(fs.openSync(cookiepath, 'w'))
          }

          data = fs.readFileSync(cookiepath).toString()

          try {
            data = JSON.parse(data)
          } catch (e) {
            data = null
          }

          if (data) {
            let jar = new CookieJar(new CookieStore(cookiepath))

            self._authjar = jar
            self.fetch = getJarFetch(self._authjar)

            return createClient(resolve)
          }
        }

        let vHttp = self._vk

        let jar = new CookieJar(new CookieStore(cookiepath))

        self._authjar = jar
        self.fetch = getJarFetch(self._authjar)

        if (!self._vk.params.reauth && !params.reauth) {
          if (Object.keys(jar).length) {
            return actCheckLogin(jar).then(() => {
              return createClient(resolve, vHttp)
            }, (r) => {
              return goLogin()
            })
          }
        }

        if (!code && !checkCodeUrl) {
          fs.writeFileSync(cookiepath, '{}')
          jar = new CookieJar(new CookieStore(cookiepath))
          self._authjar = jar
        }

        self.fetch = getJarFetch(self._authjar)

        return goLogin()

        async function makeAuthWithoutCode (_needSolve, _resolverReCall, _rejecterReCall, getData) {
          return new Promise(async (resolve, reject) => {
            let body = await self.fetch(checkCodeUrl, {
              method: 'POST',
              agent: self._vk.agent,
              body: qs.stringify(getData),
              headers: {
                ...self.headersRequest
              }
            })

            body = await body.text()

            if (body.match(/captcha/)) {
              let captchaUrl = body.match(/\/captcha.php([^"]+)/)
              if (captchaUrl) {
                captchaUrl = `${configuration.PROTOCOL}://${configuration.BASE_DOMAIN}${captchaUrl[0]}`
                let captchaSid = captchaUrl.match(/sid=([0-9]+)/)
                if (captchaSid) {
                  captchaSid = Number(captchaSid[1])

                  let err = {
                    captcha_sid: captchaSid,
                    captcha_img: captchaUrl
                  }

                  return _catchCaptcha({
                    err,
                    reCall: () => {
                      return makeAuthWithoutCode(0, 0, 0, getData)
                    },
                    _needSolve,
                    _resolverReCall,
                    _rejecterReCall,
                    data: getData,
                    reject
                  })
                } else {
                  return reject(new Error('You have captcha error, but http client dont recognize where is captcha_sid parameter'))
                }
              } else {
                return reject(new Error('You have captcha error, but http client dont recognize where'))
              }
            }

            if (body.match(/authcheck_code/)) {
              let err = new Error('Wrong code')
              err.is2fa = true
              err.isWrong = true
              return reject(err)
            }

            self._vk.debug(EVENT_RESPONSE_TYPE, {
              body: body,
              section: 'httpClient'
            })

            self._vk._debugger.push('response', body)

            if (_needSolve) {
              return _resolverReCall(createClient(resolve, vHttp))
            } else {
              return createClient(resolve, vHttp)
            }
          })
        }

        async function goLogin () {
          if (checkCodeUrl && code) {
            return makeAuthWithoutCode(0, 0, 0, {
              code,
              remember: 1,
              captcha_sid: captchaSid,
              captcha_key: captchaKey
            }).then(resolve, reject)
          }

          let url = `${configuration.PROTOCOL}://${configuration.MOBILE_SUBDOMAIN}.${configuration.BASE_DOMAIN}/`

          self._vk.debug(EVENT_REQUEST_TYPE, {
            url,
            query: ``,
            method: 'GET',
            section: 'httpClient'
          })

          self.fetch(url, {
            method: 'GET',
            headers: {
              ...self.headersRequest
            },
            agent: self._vk.agent,
            cache: 'no-cache'
          }).then(async (res) => {
            res = await res.text()

            self._vk.debug(EVENT_RESPONSE_TYPE, {
              body: res,
              section: 'httpClient'
            })

            let body = res

            self._vk._debugger.push('response', res)

            let matches = body.match(/action="(.*?)"/)

            if (!matches || !body.match(/password/)) { // Если пользовтаель уже авторизован по кукисам, чекаем сессию
              return actCheckLogin().then(() => {
                return createClient(resolve, vHttp)
              }, reject)
            }

            let POSTLoginFormUrl = matches[1]

            if (!POSTLoginFormUrl.match(/login\.vk\.com/)) return reject(self._vk._error('http_client', {}, 'not_supported'))
            return actLogin(POSTLoginFormUrl).then(resolve, reject)
          }).catch(err => reject(err))
        }
        async function actCheckLogin (jar) {
          return new Promise((resolve, reject) => {
            if (params.checkAuth === false) {
              return resolve(true)
            }

            let url = `${configuration.PROTOCOL}://${configuration.BASE_DOMAIN}/al_im.php`

            let form = {
              act: 'a_dialogs_preload',
              al: 1,
              gid: 0,
              im_v: 3,
              rs: ''
            }

            self._vk.debug(EVENT_REQUEST_TYPE, {
              url,
              query: form,
              method: 'POST',
              section: 'httpClient'
            })

            return self.fetch(url, {
              method: 'POST',
              url,
              body: qs.stringify(form),
              agent: self._vk.agent,
              headers: {
                ...self.headersRequest,
                'x-requested-with': 'XMLHttpRequest'
              }
            }).then(async (res) => {
              res = await res.text()

              self._vk.debug(EVENT_RESPONSE_TYPE, {
                body: res,
                section: 'httpClient'
              })

              self._vk._debugger.push('response', res)
              res = self._parseResponse(res)
              if (Number(res.payload[0]) === 0) {
                return resolve(true)
              } else {
                return reject(new Error('Need update session'))
              }
            }).catch(err => reject(err))
          })
        }

        function _catchCaptcha (params = {}) {
          let { err, reCall, _needSolve, _rejecterReCall, data, reject } = params

          let vkr = err

          if (_needSolve) {
            try {
              _rejecterReCall({
                error: false,
                reCall: () => {
                  return reCall()
                }
              })
            } catch (e) { reject(e) }

            return
          }

          const captchaSid = vkr.captcha_sid
          const captchaImg = vkr.captcha_img

          let paramsForHandler = {
            captcha_sid: captchaSid,
            captcha_img: captchaImg,
            params: data,
            vk: self._vk
          }

          paramsForHandler.resolve = (captchaKey) => {
            return new Promise((resolve, reject) => {
              data.captcha_key = captchaKey
              data.captcha_sid = captchaSid

              try {
                reCall('NEED SOLVE', resolve, reject, data)
              } catch (errorRecall) { /* Need pass it */ }
            })
          }

          try {
            captchaHandler(paramsForHandler)
          } catch (e) {
            reject(e)
          }
        }

        async function actLogin (loginURL) {
          return new Promise(async (resolve, reject) => {
            async function makeAuth (_needSolve, _resolverReCall, _rejecterReCall, getData) {
              return self.fetch(loginURL, {
                method: 'POST',
                agent: self._vk.agent,
                body: qs.stringify(getData),
                headers: {
                  ...self.headersRequest
                }
              }).then(async res => {
                let body = await res.text()

                if (body.match(/service_msg service_msg_warning/g)) {
                  let errText = body.match(/<div class="service_msg service_msg_warning">(.*)<\/div>/)
                  if (errText && errText[1]) {
                    errText = errText[1].replace(/<[^>]*>/g, '')
                  }
                  let err = new Error(errText || 'Invalid login or password')
                  err.type = 'invalid-login'
                  return reject(err)
                }

                if (body.match(/authcheck_code/)) {
                  if (code) {
                    let checkCodeURL = checkCodeUrl

                    if (!checkCodeURL) {
                      checkCodeURL = body.match(/action([\s]+)?=([\s]+)?("|')(\/login\?act=authcheck_code([^"']+))/)

                      checkCodeURL = checkCodeURL ? checkCodeURL[4] : null

                      if (!checkCodeURL) return reject(new Error('Not found authcheck url'))

                      checkCodeURL = `${configuration.PROTOCOL}://${configuration.MOBILE_SUBDOMAIN}.${configuration.BASE_DOMAIN}${checkCodeURL}`
                    }

                    let checkCodeData = {
                      _ajax: 1,
                      code,
                      remember: 1
                    }

                    let res = await self.fetch(checkCodeURL, {
                      method: 'POST',
                      agent: self._vk.agent,
                      body: qs.stringify(checkCodeData),
                      headers: {
                        ...self.headersRequest
                      }
                    })

                    res = await res.text()

                    if (res.match(/authcheck_code/)) {
                      let err = new Error('Wrong code')
                      err.is2fa = true
                      err.isWrong = true
                      return reject(err)
                    }
                  } else {
                    let err = new Error('You need input two factor code')

                    err.is2fa = true

                    let checkCodeURL = body.match(/action([\s]+)?=([\s]+)?("|')(\/login\?act=authcheck_code([^"']+))/)

                    checkCodeURL = checkCodeURL ? checkCodeURL[4] : ''
                    checkCodeURL = `${configuration.PROTOCOL}://${configuration.MOBILE_SUBDOMAIN}.${configuration.BASE_DOMAIN}${checkCodeURL}`

                    err.checkCodeUrl = checkCodeURL

                    return reject(err)
                  }
                }

                if (body.match(/captcha/)) {
                  let captchaUrl = body.match(/\/captcha.php([^"]+)/)
                  if (captchaUrl) {
                    captchaUrl = `${configuration.PROTOCOL}://${configuration.BASE_DOMAIN}${captchaUrl[0]}`
                    let captchaSid = captchaUrl.match(/sid=([0-9]+)/)
                    if (captchaSid) {
                      captchaSid = Number(captchaSid[1])

                      let err = {
                        captcha_sid: captchaSid,
                        captcha_img: captchaUrl
                      }

                      return _catchCaptcha({
                        err,
                        reCall: () => {
                          return makeAuth(0, 0, 0, getData)
                        },
                        _needSolve,
                        _resolverReCall,
                        _rejecterReCall,
                        data: getData,
                        reject
                      })
                    } else {
                      return reject(new Error('You have captcha error, but http client dont recognize where is captcha_sid parameter'))
                    }
                  } else {
                    return reject(new Error('You have captcha error, but http client dont recognize where'))
                  }
                }

                self._vk.debug(EVENT_RESPONSE_TYPE, {
                  body: body,
                  section: 'httpClient'
                })

                self._vk._debugger.push('response', body)
                if (_needSolve) {
                  return _resolverReCall(createClient(resolve, vHttp))
                } else {
                  return createClient(resolve, vHttp)
                }
              }).catch(err => reject(err))
            }

            return makeAuth(0, 0, 0, {
              email: login,
              pass,
              captcha_sid: captchaSid,
              captcha_key: captchaKey
            })
          })
        }

        async function createClient (r, vHttp) {
          let HTTPClient = new HTTPEasyVKClient({
            _jar: self._authjar,
            vk: self._vk,
            httpVk: vHttp,
            config: self._config,
            parser: self._parseResponse,
            fetch: self.fetch
          })

          await HTTPClient.goDesktop()

          return r(HTTPClient)
        }
      }, reject)
    })
  }
}

function getJarFetch (jar) {
  return async function myFetch (url, options) {
    if (!options) options = {}
    if (!options.headers) options.headers = {}
    if (!options.jar) options.jar = jar

    if (options.jar) {
      let cookies = options.jar.getCookiesSync(url).join('; ')
      options.headers = {
        ...options.headers,
        cookie: cookies
      }
    }

    const opts = Object.assign({}, options, { redirect: 'manual' })

    let res = await nodeFetch(url, opts)

    return new Promise(async (resolve, reject) => {
      if (res.headers.raw()['set-cookie']) { // Set cookies like browser
        let cookies = res.headers.raw()['set-cookie'].map(Cookie.parse)
        let promises = []

        if (options.jar) {
          cookies.forEach(cookie => {
            promises.push(new Promise((resolve, reject) => {
              options.jar.setCookie(cookie, res.url, () => {
                return resolve(true)
              })
            }))
          })
        }

        await Promise.all(promises)
      }

      const isRedirect = (res.status === 303 || ((res.status === 301 || res.status === 302 || res.status === 307)))

      if (isRedirect) {
        const optsForGet = Object.assign({}, {
          method: res.status === 307 ? options.method : 'GET',
          body: res.status === 307 ? options.body : null,
          follow: options.follow !== undefined ? options.follow - 1 : undefined,
          agent: options.agent,
          headers: options.headers
        })

        return myFetch(res.headers.get('location'), optsForGet)
          .then((res) => {
            return resolve(res)
          })
      }

      return resolve(res)
    })
  }
}

export default HTTPEasyVK
