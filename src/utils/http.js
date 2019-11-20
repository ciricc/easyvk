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
const request = require('request')
const FileCookieStore = require('tough-cookie-file-store')

const staticMethods = require('./staticMethods.js')
const VKResponse = require('./VKResponse.js')

const AudioAPI = require('./AudioAPI.js')
const Debugger = require('./debugger.class.js')

const encoding = require('encoding')

class HTTPEasyVKClient {
  constructor ({ _jar, vk, httpVk, config, parser }) {
    let self = this

    self._config = config

    self.headersRequest = {
      'User-Agent': self._config.user_agent,
      'content-type': 'application/x-www-form-urlencoded'
    }

    self.LOGIN_ERROR = 'Need login by form, use .loginByForm() method'
    self._vk = vk
    self._authjar = _jar
    self._parser = parser

    self.audio = new AudioAPI(self._vk, self)
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

      request.get({
        url: url,
        jar: self._authjar,
        headers: self.headersRequest,
        agent: self._vk.agent
      }, (err, res, vkr) => {
        self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
          body: res.body,
          section: 'httpClient'
        })

        if (err) return reject(new Error(err))

        let stories = self.__getStories(res.body, 'profile')
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

        resolve({
          vk: self._vk,
          count: i
        })
      })
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

  __readStory (read_hash = '', stories = '', source = 'feed', cb) {
    let self = this

    let url = 'https://vk.com/al_stories.php'
    let form = {
      'act': 'read_stories',
      'al': '1',
      'hash': read_hash,
      'source': source,
      'stories': stories
    }

    self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
      url,
      query: form,
      method: 'POST',
      section: 'httpClient'
    })

    request.post({
      url,
      form: form,
      jar: self._authjar,
      headers: self.headersRequest,
      agent: self._vk.agent
    }, (e, res, be) => {
      self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
        body: res.body,
        section: 'httpClient'
      })

      return (cb) ? cb(e, res, be) : true
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

      request.get({
        url,
        jar: self._authjar,
        headers: self.headersRequest,
        agent: self._vk.agent
      }, (err, res, vkr) => {
        self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
          body: res.body,
          section: 'httpClient'
        })

        if (err) return reject(new Error(err))

        // parse stories

        let stories = self.__getStories(res.body, 'feed')

        let i = 0

        stories.forEach((story) => {
          if (Array.isArray(story.items)) {
            story.items.forEach(item => {
              self.__readStory(story.read_hash, item.raw_id, 'feed', () => {})
              i++
            })
          }
        })

        resolve({
          vk: self._vk,
          count: i
        })
      })
    })
  }

  async addBotToConf (params = {}) {
    let self = this

    return new Promise((resolve, reject) => {
      self.request('al_groups.php', {
        _ads_group_id: params.group_id || 0,
        act: 'a_search_chats_box',
        al: 1,
        group_id: params.group_id || 0
      }, false, 8).then(vkr => {
        let json = self._parseResponse(vkr.body.split('<!>'))
        json = json[8]

        let addHash = json.add_hash

        self.request('al_im.php', {
          _ads_group_id: params.group_id || 0,
          act: 'a_add_bots_to_chat',
          add_hash: addHash,
          al: 1,
          bot_id: (-params.group_id || -1),
          peer_ids: params.peer_ids
        }, true).then(resolve, reject)
      }).catch(reject)
    })
  }

  async request (file, form = {}, ignoreStringError = false, indexJson = 6, post = true, isMobile = false) {
    let self = this

    return new Promise((resolve, reject) => {
      let mobile = ''

      if (isMobile) {
        mobile = 'm.'
      }

      let method = 'post'

      if (post !== true) method = 'get'

      let headers = {
        'user_agent': self._config.user_agent
      }

      if ((isMobile && method === 'post') || form.XML === true) {
        headers['x-requested-with'] = 'XMLHttpRequest'
      }

      let requestParams = {
        jar: self._authjar,
        url: `${configuration.PROTOCOL}://${mobile}${configuration.BASE_DOMAIN}/` + file,
        form: form,
        encoding: 'binary',
        headers: headers,
        agent: self._vk.agent
      }

      if (method === 'get') {
        requestParams.form = undefined
      }

      self._vk._debugger.push('request', requestParams)

      self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
        url: requestParams.url,
        query: form,
        section: 'httpClient',
        method: method
      })

      request[method](requestParams, (err, res, vkr) => {
        self._vk._debugger.push('response', res.body)

        self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
          url: requestParams.url,
          query: form,
          section: 'httpClient',
          body: res.body
        })

        if (err) {
          return reject(err)
        }

        if (!res.body.length) {
          return reject(self._vk._error('audio_api', {}, 'not_have_access'))
        }

        if (form.utf8) {
          res.body = encoding.convert(res.body, 'utf-8', 'windows-1251').toString()
        }

        if (form.retOnlyBody) return resolve(res)

        if (!isMobile) {
          let json = self._parseResponse(res.body.split('<!>'))

          if (typeof json[indexJson] === 'object') json[5] = json[indexJson]

          if (typeof json[5] === 'string' && !ignoreStringError) {
            return reject(new Error(json[5].slice(0, 250) || 'Empty error responded'))
          }

          if (!json[5] && !ignoreStringError) {
            return reject(self._vk._error('audio_api', {}, 'not_have_access'))
          }

          if (form.autoParse) {
            return resolve({
              vkr: VKResponse(staticMethods, {
                response: json[5]
              }),
              json: json,
              body: res.body,
              vk: self._vk
            })
          }
        }

        return resolve(res)
      })
    })
  }

  async goDesktop () {
    return this.request('fv?to=/mail?_fm=mail&_fm2=1', {}, true, 6, false, true)
  }

  async goMobile () {
    return this.request('mail?act=show&peer=0&_ff=1', {}, true, 6, false, true)
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
      return reject(self._vk._error('audio_api', {}, 'not_have_access'))
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
      if (!params.user_agent) {
        params.user_agent = configuration['HTTP_CLIENT']['USER_AGENT']
      }

      params.user_agent = String(params.user_agent)

      if (!params.cookies) {
        params.cookies = configuration['HTTP_CLIENT']['COOKIE_PATH']
      }

      params.cookies = String(params.cookies)

      return resolve(params)
    })
  }

  _parseResponse (e) {
    for (var o = e.length - 1; o >= 0; --o) {
      var n = e[o]
      if (n.substr(0, 2) === '<!') {
        var i = n.indexOf('>')

        var r = n.substr(2, i - 2)
        n = n.substr(i + 1)
        switch (r) {
          case 'json':

            try {
              e[o] = JSON.parse(n)
            } catch (e) {
              e[o] = {}
            }

            break
          case 'int':
            e[o] = parseInt(n, 10)
            break
          case 'float':
            e[o] = parseFloat(n)
            break
          case 'bool':
            e[o] = !!parseInt(n, 10)
            break
          case 'null':
            e[o] = null
            break
          case 'debug':
            console.log('debug')
        }
      }
    }

    return e
  }

  async loginByForm (params = {}) {
    let self = this

    return new Promise((resolve, reject) => {
      let pass = self._vk.params.password
      let login = self._vk.params.username

      if (!pass || !login) return reject(self._vk._error('http_client', {}, 'need_auth'))

      self.__checkHttpParams(params).then((p) => {
        let params = p

        self._config = params

        self.headersRequest['User-Agent'] = self._config.user_agent

        let cookiepath = self._config.cookies

        if (!self._vk.params.reauth) {
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
            let jar = request.jar(new FileCookieStore(cookiepath))

            self._authjar = jar

            return createClient(resolve)
          }
        }

        let easyvk = require('../index.js')

        easyvk({
          password: pass,
          username: login,
          save_session: false,
          reauth: true,
          proxy: self._vk.params.proxy
        }).then((vkHtpp) => {
          let vHttp = vkHtpp

          easyvk = null

          // Make first request, for know url for POST request
          // parse from m.vk.com page

          fs.writeFileSync(cookiepath, '{}')

          let jar = request.jar(new FileCookieStore(cookiepath))

          self._authjar = jar

          if (Object.keys(jar._jar.store.idx).length) {
            return actCheckLogin().then(() => {
              return createClient(resolve, vHttp)
            }, () => {
              return goLogin()
            })
          }

          return goLogin()

          function goLogin () {
            let url = 'https://m.vk.com/'

            self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
              url,
              query: ``,
              method: 'GET',
              section: 'httpClient'
            })

            request.get({
              headers: self.headersRequest,
              url,
              jar: self._authjar,
              agent: self._vk.agent
            }, (err, res, vkr) => {
              self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
                body: res.body,
                section: 'httpClient'
              })

              if (err) return reject(new Error(err))

              let body = res.body

              self._vk._debugger.push('response', res.body)

              let matches = body.match(/action="(.*?)"/)

              if (!matches || !body.match(/password/)) { // Если пользовтаель уже авторизован по кукисам, чекаем сессию
                return actCheckLogin().then(() => {
                  return createClient(resolve, vHttp)
                }, reject)
              }

              let POSTLoginFormUrl = matches[1]

              if (!POSTLoginFormUrl.match(/login\.vk\.com/)) return reject(self._vk._error('http_client', {}, 'not_supported'))

              actLogin(POSTLoginFormUrl).then(resolve, reject)
            })
          }

          async function actCheckLogin () {
            return new Promise((resolve, reject) => {
              let url = 'https://vk.com/al_im.php'
              let form = {
                act: 'a_dialogs_preload',
                al: 1,
                gid: 0,
                im_v: 2,
                rs: ''
              }

              self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
                url,
                query: form,
                method: 'POST',
                section: 'httpClient'
              })

              request.post({
                url,
                jar: self._authjar,
                followAllRedirects: true,
                form,
                agent: self._vk.agent
              }, (err, res) => {
                self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
                  body: res.body,
                  section: 'httpClient'
                })

                if (err) return reject(err)

                self._vk._debugger.push('response', res.body)

                res = res.body.split('<!>')
                res = self._parseResponse(res[5])

                if (res.match(/<!json>/)) {
                  res = res.replace('<!json>', '')
                  try {
                    res = JSON.parse(res)
                  } catch (e) {
                    return reject(new Error('Need update session not valid json'))
                  }
                  return resolve(true)
                }
                return reject(new Error('Need update session'))
              })
            })
          }
          async function actLogin (loginURL) {
            return new Promise((resolve, reject) => {
              let form = {
                'email': login,
                'pass': pass
              }

              self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
                url: loginURL,
                query: form,
                method: 'POST',
                section: 'httpClient'
              })

              request.post({
                url: loginURL,
                jar: self._authjar,
                followAllRedirects: true,
                form: form,
                agent: self._vk.agent
              }, (err, res, vkr) => {
                self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
                  body: res.body,
                  section: 'httpClient'
                })

                self._vk._debugger.push('response', res.body)

                if (err) return reject(new Error(err))

                return createClient(resolve, vHttp)
              })
            })
          }
        }, reject)

        async function createClient (r, vHttp) {
          let HTTPClient = new HTTPEasyVKClient({
            _jar: self._authjar,
            vk: self._vk,
            httpVk: vHttp,
            config: self._config,
            parser: self._parseResponse
          })

          await HTTPClient.goDesktop()

          return r({
            client: HTTPClient,
            vk: self._vk
          })
        }
      }, reject)
    })
  }
}

module.exports = HTTPEasyVK
