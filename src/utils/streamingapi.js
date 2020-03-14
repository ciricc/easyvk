
/**
 *  Added support Streaming API, module for EasyVK.
 *  You can use it for listen and collect data from vk, create metrics and other...
 *
 *  Author: @ciricc
 *  License: MIT
 *
 */

'use strict'

const fetch = require('node-fetch')
const qs = require('qs')

const staticMethods = require('./staticMethods.js')
const EventEmitter = require('fast-event-emitter')

const configuration = require('./configuration.js')
const WS = require('ws')
const Debugger = require('./debugger.class.js')

class StreamingAPIConnection extends EventEmitter {
  constructor (vk, session, wsc) {
    super()

    let self = this

    self._vk = vk
    self._session = session
    self._wsc = wsc
    self._urlHttp = `${configuration.PROTOCOL}://${self._session.server.endpoint}`
    self._key = self._session.server.key
    self.__initWebSocket()
  }

  __initWebSocket () {
    let self = this

    self._wsc.on('error', (error) => {
      self.emit('error', new Error(error.toString()))
    })

    self._wsc.on('message', (message) => {
      self.__initMessage(message)
    })

    self._wsc.on('close', (r) => {
      self.emit('failure', `Connection closed ${(r) ? '(' + r + ')' : ''}`)
    })
  }

  __initMessage (msgBody) {
    var self = this

    try {
      let body = JSON.parse(msgBody)
      if (parseInt(body.code) === 100) {
        self.emit(body.event.event_type, body.event)
        self.emit('pullEvent', body.event)
      } else if (body.code === 300) {
        self.emit('serviceMessage', body.service_message)
      }
    } catch (e) {
      self.emit('error', e)
    }
  }

  async close () {
    let self = this

    return new Promise((resolve, reject) => {
      if (self._wsc) {
        return resolve(self._wsc.close())
      } else {
        return reject(new Error('WebSocket not connected'))
      }
    })
  }

  async __MRHTTPURL (method, json) {
    return new Promise((resolve, reject) => {
      method = method.toString().toLocaleLowerCase()

      let url = `${this._urlHttp}/rules`
      json = {
        ...json,
        key: this._key
      }

      let queryParams = {
        method: method,
        body: method === 'get' ? null : JSON.stringify(json),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        agent: this._vk.agent
      }

      if (this._vk && this._vk.debug) {
        this._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
          url,
          query: json,
          section: 'streamingAPI',
          method: method.toUpperCase()
        })
      }

      if (method === 'get') {
        url = url + '?' + qs.stringify(json)
      } else {
        url = url + '?key=' + this._key
      }

      return fetch(url, queryParams).then(async (res) => {
        let vkr = await res.json()

        if (this._vk && this._vk._debugger) {
          try {
            this._vk._debugger.push('response', vkr)
          } catch (e) {
            // Ignore
          }
        }

        if (this._vk && this._vk.debug) {
          this._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
            body: vkr,
            section: 'streamingAPI'
          })
        }

        if (vkr) {
          let json = staticMethods.checkJSONErrors(vkr, reject)
          if (json) {
            return resolve(json)
          } else {
            return reject(new Error("JSON is not valid... oor i don't know"))
          }
        } else {
          reject(new Error(`Empty response ${vkr}`))
        }
      })
    })
  }

  async addRule (tag, rule) {
    let MRHTTPParams = {
      'rule': {
        'value': rule,
        'tag': tag
      }
    }
    return this.__MRHTTPURL('POST', MRHTTPParams)
  }

  async deleteRule (tag) {
    let MRHTTPParams = {
      'tag': tag
    }
    return this.__MRHTTPURL('DELETE', MRHTTPParams)
  }

  async getRules () {
    return this.__MRHTTPURL('GET', {})
  }

  async deleteAllRules () {
    let self = this

    return new Promise((resolve, reject) => {
      // For begin - get All rules
      self.getRules().then((rules) => {
        rules = rules.rules
        let i = 0

        function del () {
          if (i === rules.length) {
            return resolve(true)
          }

          let rule = rules[i]

          self.deleteRule(rule.tag).then(() => {
            i++

            setTimeout(() => {
              del()
            }, 600)
          }, reject)
        }

        if (rules) {
          del()
        } else {
          return resolve(true)
        }
      }, reject)
    })
  }

  async initRules (rulesObject = {}, callBackError) {
    let self = this

    return new Promise((resolve, reject) => {
      if (!staticMethods.isObject(rulesObject)) {
        return reject(new Error('rules must be an object'))
      }

      if (callBackError) {
        if (Object.prototype.toString.call(callBackError) !== '[object Function]') {
          return reject(new Error('callBackError must be function'))
        }
      }

      // For begin get all rules and then change/add/delete rules
      self.getRules().then((startedRules) => {
        let changedRules, stRulesObject, tags, addedRules, deletedRules

        startedRules = startedRules.rules

        if (!startedRules) {
          startedRules = []
        }

        changedRules = []
        addedRules = []
        deletedRules = []
        stRulesObject = {}
        tags = []

        for (let l = 0; l < startedRules.length; l++) {
          let rule = startedRules[l]
          stRulesObject[rule.tag] = rule.value
        }

        for (let tag in rulesObject) {
          tags.push(tag)
        }

        let iN = 0
        let i = 0

        function next () {
          i++

          setTimeout(() => {
            initRule()
          }, 400)
        }

        function initRule () {
          if (i >= startedRules.length) {
            return initAddRule()
          }

          let rule = startedRules[i]

          if (rulesObject[rule.tag]) { // Change rule
            if (rule.value === rulesObject[rule.tag]) { // No need change
              next()
            } else {
              // Need change it. Delete and it and then add
              self.deleteRule(rule.tag).then(() => {
                // Add again

                self.addRule(rule.tag, rulesObject[rule.tag]).then(() => {
                  // Success changed
                  changedRules.push({
                    tag: rule.tag,
                    lastValue: rule.value,
                    newValue: rulesObject[rule.tag]
                  })

                  next()
                }, (err) => {
                  if (callBackError) {
                    callBackError({
                      where: 'add changes',
                      rule: rule,
                      from: 'user_rules',
                      description: 'Occured error in add method when we tried add rule which was changed',
                      error: err
                    })
                  } else {
                    throw err
                  }

                  next()
                })
              }, (err) => {
                if (callBackError) {
                  callBackError({
                    where: 'delete changes',
                    rule: rule,
                    from: 'vk_rules',
                    description: 'Occured error in delete method when we tried delete rule which was changed',
                    error: err
                  })
                } else {
                  throw err
                }

                next()
              })
            }
          } else { // Delete rule
            self.deleteRule(rule.tag).then(() => {
              // Success deleted
              deletedRules.push({
                tag: rule.tag,
                value: rule.value
              })

              next()
            }, (err) => {
              if (callBackError) {
                callBackError({
                  where: 'delete',
                  rule: rule,
                  from: 'vk_rules',
                  description: 'Occured error in delete method when we tried delete rule which not declared in init object',
                  error: err
                })
              } else {
                throw err
              }

              next()
            })
          }
        }

        initRule()

        function nextAdd () {
          iN++

          setTimeout(() => {
            initAddRule()
          }, 400)
        }

        function initAddRule () {
          if (iN >= tags.length) {
            return resolve({
              changedRules: changedRules,
              addedRules: addedRules,
              deletedRules: deletedRules
            })
          }

          let rule = tags[iN]

          if (!stRulesObject.hasOwnProperty(tags[iN])) { // Need add new rules
            self.addRule(tags[iN], rulesObject[tags[iN]]).then(() => {
              // Success add
              addedRules.push({
                tag: tags[iN],
                value: rulesObject[tags[iN]]
              })

              nextAdd()
            }, (err) => {
              if (callBackError) {
                callBackError({
                  where: 'add',
                  rule: rule,
                  from: 'user_rules',
                  description: 'Occured error in add method when we tried add rule which not declared in vk rules',
                  error: err
                })
              } else {
                throw err
              }

              nextAdd()
            })
          } else {
            nextAdd()
          }
        }
      }, reject)
    })
  }
}

class StreamingAPIConnector {
  constructor (vk) {
    let self = this
    self._vk = vk
  }

  async connect (applicationParams = {}) {
    let self = this

    function initConnect (json = {}) {
      return new Promise((resolve, reject) => {
        staticMethods.call('streaming.getServerUrl', {
          access_token: json.access_token
        }).then((vkrURL) => {
          let streamingSession, wsc

          streamingSession = {
            server: vkrURL,
            client: json
          }

          wsc = new WS(`wss://${streamingSession.server.endpoint}/stream?key=${streamingSession.server.key}`, {
            agent: self._vk.agent
          })

          wsc.on('open', () => {
            let _StreamingAPIConnecton =
            new StreamingAPIConnection(self._vk, streamingSession, wsc)

            return resolve(_StreamingAPIConnecton)
          })
        }, reject)
      })
    }
    return new Promise((resolve, reject) => {
      if (applicationParams) {
        if (!staticMethods.isObject(applicationParams)) {
          return reject(new Error('application params must be an objct parameter'))
        }
      }

      if (!applicationParams.clientId || !applicationParams.clientSecret) {
        if (self._vk && self._vk.__credentials_flow_type) {
          applicationParams.clientId = self._vk.params.client_id
          applicationParams.clientSecret = self._vk.params.client_secret
        }
      }

      if (applicationParams.clientId && applicationParams.clientSecret) {
        if (self._vk && self._vk.__credentials_flow_type) {
          initConnect(self._vk.session).then(resolve, reject)
        } else {
          let getParams = {
            client_id: applicationParams.clientId,
            client_secret: applicationParams.clientSecret,
            grant_type: 'client_credentials'
          }

          let url = `${configuration.BASE_OAUTH_URL}access_token?` + qs.stringify(getParams)

          if (this._vk && this._vk.debug) {
            this._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
              url,
              query: getParams,
              section: 'streamingAPI',
              method: 'GET'
            })
          }

          return fetch(url, {
            agent: self._vk.agent
          }).then(async (res) => {
            let vkr = await res.json()

            if (self._vk && self._vk._debugger) {
              try {
                self._vk._debugger.push('response', vkr)
              } catch (e) {
                // Ignore
              }
            }

            if (this._vk && this._vk.debug) {
              this._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
                body: vkr,
                section: 'streamingAPI'
              })
            }

            if (vkr) {
              let json = staticMethods.checkJSONErrors(vkr, reject)

              if (json) {
                initConnect(json).then(resolve, reject)
              } else {
                return reject(new Error("JSON is not valid... oor i don't know"))
              }
            } else {
              return reject(new Error(`Empty response ${vkr}`))
            }
          })
        }
      } else {
        return reject(new Error('clientId and clientSecret not declared'))
      }
    })
  }
}

module.exports = StreamingAPIConnector
