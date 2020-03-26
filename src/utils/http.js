/**
 *   In this file are http widgets for EasyVK
 *   You can use it
 *
 *   Author: @ciricc
 *   License: MIT
 *
 */

'use strict'

const configuration = require('./configuration.js')

const fs = require('fs')

const CookieStore = require('tough-cookie-file-store')
const CookieJar = require('tough-cookie').CookieJar

const nodeFetch = require('node-fetch')
const fetchUse = require('fetch-cookie/node-fetch')
const qs = require('qs')

const staticMethods = require('./staticMethods.js')
const VKResponse = require('./VKResponse.js')

const Debugger = require('./debugger.class.js')

const encoding = require('encoding')

let fetch = null

class HTTPEasyVKClient {
  constructor ({ _jar, vk, httpVk, config, parser }) {
    this._config = config

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

  async readStories (vkId = 0, storyId = 0) {
    let self = this

    storyId = Number(storyId)
    if (isNaN(storyId)) storyId = 0

    return new Promise((resolve, reject) => {
      vkId = Number(vkId)

      if (isNaN(vkId)) return reject(new Error('Is not numeric vk_id'))

      // else try get sttories from user
      if (!self._authjar) return reject(new Error(self.LOGIN_ERROR))

      let url = `${configuration.PROTOCOL}://m.${configuration.BASE_DOMAIN}/fv?to=/id${vkId}?_fm=profile&_fm2=1`

      self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
        url,
        query: `to=/id${vkId}?_fm=profile&_fm2=1`,
        method: 'GET',
        section: 'httpClient'
      })

      return fetch(url, {
        method: 'GET',
        headers: self.headersRequest,
        agent: self._vk.agent
      }).then(async (res) => {
        res = await res.textConverted()

        self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
          body: res,
          section: 'httpClient'
        })

        let stories = self.__getStories(res, 'profile')
        let i = 0

        stories.forEach((story) => {
          if (Array.isArray(story.items)) {
            story.items.forEach(item => {
              self._story_read_hash = story.read_hash

              if (storyId) {
                // Only one story
                if (item.raw_id === storyId) {
                  self.__readStory(story.read_hash, item.raw_id, 'profile')
                }
              } else {
                // All stories
                self.__readStory(story.read_hash, item.raw_id, 'profile')
              }

              i++
            })
          }
        })

        return resolve(i)
      }).catch(err => reject(err))
    })
  }

  __getStories (response = '', type = 'feed') {
    response = String(response)

    let storiesMatch, superStories

    if (type === 'feed') {
      storiesMatch = /cur\['stories_list_feed'\]=\[(.*?)\];/
      superStories = /cur\['stories_list_feed'\]=/
    } else {
      storiesMatch = /cur\['stories_list_profile'\]=\[(.*?)\];/
      superStories = /cur\['stories_list_profile'\]=/
    }

    let stories = response.match(storiesMatch)

    if (!stories || !stories[0]) return []

    try {
      stories = JSON.parse(
        String(stories[0])
          .replace(superStories, '')
          .replace(/;/g, '')
      )
    } catch (e) {
      stories = []
    }

    return stories
  }

  async __readStory (read_hash = '', stories = '', source = 'feed', cb) {
    let self = this

    let url = 'al_stories.php'

    let form = {
      act: 'read_stories',
      'al': '1',
      'all': 1,
      'connection_type': 'wi-fi',
      'hash': read_hash,
      'source': source,
      'progress': 0,
      'story_id': stories,
      XML: true
    }

    self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
      url,
      query: form,
      method: 'POST',
      section: 'httpClient'
    })

    return this.post(url, form).then((res) => {
      return (cb) ? cb(null, res, null) : true
    })
  }

  async readFeedStories () {
    let self = this

    return new Promise((resolve, reject) => {
      // else try get sttories from user
      if (!self._authjar) return reject(new Error(self.LOGIN_ERROR))

      let url = `${configuration.PROTOCOL}://m.${configuration.BASE_DOMAIN}/fv?to=%2Ffeed%3F_fm%3Dfeed%26_fm2%3D1`

      self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
        url,
        query: `to=%2Ffeed%3F_fm%3Dfeed%26_fm2%3D1`,
        method: 'GET',
        section: 'httpClient'
      })

      return fetch(url, {
        headers: self.headersRequest,
        agent: self._vk.agent
      }).then(async (res) => {
        res = await res.text()

        self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
          body: res,
          section: 'httpClient'
        })

        // parse stories
        let stories = self.__getStories(res, 'feed')

        let i = 0

        stories.forEach((story) => {
          if (Array.isArray(story.items)) {
            story.items.forEach(item => {
              self.__readStory(story.read_hash, item.raw_id, 'feed')
              i++
            })
          }
        })

        return resolve(i)
      }).catch(err => reject(err))
    })
  }

  async post (file, form, isMobile) {
    return this.request(file, form, true, isMobile)
  }

  async get (file, form, isMobile) {
    return this.request(file, form, false, isMobile)
  }

  async request (file, form = {}, post = true, isMobile = false) {
    let self = this

    return new Promise((resolve, reject) => {
      let mobile = ''

      if (isMobile) {
        mobile = 'm.'
      }

      let method = 'post'

      if (post !== true) method = 'get'

      let headers = {
        'user_agent': self._config.userAgent
      }

      if ((isMobile && method === 'post') || form.XML === true) {
        headers['x-requested-with'] = 'XMLHttpRequest'
      }

      headers['content-type'] = 'application/x-www-form-urlencoded'

      let url = `${configuration.PROTOCOL}://${mobile}${configuration.BASE_DOMAIN}/` + file

      self._vk._debugger.push('request', {
        url,
        method,
        headers,
        form
      })

      self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
        url,
        query: form,
        section: 'httpClient',
        method: method
      })

      return fetch(url, {
        agent: self._vk.agent,
        headers,
        method,
        body: method === 'get' ? undefined : qs.stringify(form),
        qs: method === 'get' ? form : undefined
      }).then(async (res) => {
        res = await res.text()

        self._vk._debugger.push('response', res)

        self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
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
            fetch = fetchUse(nodeFetch, jar)
            return createClient(resolve)
          }
        }

        let vHttp = self._vk

        let jar = new CookieJar(new CookieStore(cookiepath))
        self._authjar = jar
        fetch = fetchUse(nodeFetch, jar)

        if (!self._vk.params.reauth && !params.reauth) {
          if (Object.keys(jar).length) {
            return actCheckLogin(jar).then(() => {
              return createClient(resolve, vHttp)
            }, (r) => {
              return goLogin()
            })
          }
        }

        fs.writeFileSync(cookiepath, '{}')
        jar = new CookieJar(new CookieStore(cookiepath))
        self._authjar = jar
        fetch = fetchUse(nodeFetch, jar)

        return goLogin()

        async function goLogin () {
          let url = `${configuration.PROTOCOL}://${configuration.MOBILE_SUBDOMAIN}.${configuration.BASE_DOMAIN}/`

          self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
            url,
            query: ``,
            method: 'GET',
            section: 'httpClient'
          })

          fetch(url, {
            method: 'GET',
            headers: {
              ...self.headersRequest
            },
            agent: self._vk.agent,
            cache: 'no-cache'
          }).then(async (res) => {
            res = await res.text()

            self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
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
            let url = `${configuration.PROTOCOL}://${configuration.BASE_DOMAIN}/al_im.php`

            let form = {
              act: 'a_dialogs_preload',
              al: 1,
              gid: 0,
              im_v: 3,
              rs: ''
            }

            self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
              url,
              query: form,
              method: 'POST',
              section: 'httpClient'
            })

            return fetch(url, {
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

              self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
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

          captchaHandler(paramsForHandler)
        }

        async function actLogin (loginURL) {
          return new Promise((resolve, reject) => {
            async function makeAuth (_needSolve, _resolverReCall, _rejecterReCall, getData) {
              return fetch(loginURL, {
                method: 'POST',
                agent: self._vk.agent,
                body: qs.stringify(getData),
                headers: {
                  ...self.headersRequest
                }
              }).then(async res => {
                let body = await res.text()
                if (body.match(/authcheck_code/)) {
                  if (code) {
                    let checkCodeURL = body.match(/action([\s]+)?=([\s]+)?("|')(\/login\?act=authcheck_code([^"']+))/)

                    checkCodeURL = checkCodeURL ? checkCodeURL[4] : null

                    if (!checkCodeURL) return reject(new Error('Not found authcheck url'))
                    checkCodeURL = `${configuration.PROTOCOL}://${configuration.MOBILE_SUBDOMAIN}.${configuration.BASE_DOMAIN}${checkCodeURL}`

                    let checkCodeData = {
                      _ajax: 1,
                      code,
                      remember: 1
                    }

                    let res = await fetch(checkCodeURL, {
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
                    return reject(err)
                  }
                }

                if (body.match(/captcha/)) {
                  let captchaUrl = body.match(/\/captcha.php([^"]+)/)
                  if (captchaUrl) {
                    captchaUrl = `${configuration.PROTOCOL}:://${configuration.BASE_DOMAIN}${captchaUrl[0]}`
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
                self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
                  body: body,
                  section: 'httpClient'
                })

                self._vk._debugger.push('response', body)

                return createClient(resolve, vHttp)
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
            parser: self._parseResponse
          })

          await HTTPClient.goDesktop()

          return r(HTTPClient)
        }
      }, reject)
    })
  }
}

module.exports = HTTPEasyVK
