'use strict'

const fetch = require('node-fetch')
const qs = require('qs')

const staticMethods = require('./staticMethods.js')
const EventEmitter = require('fast-event-emitter')
const EasyVKMiddlewares = require('./middlewares.js')
const Debugger = require('./debugger.class.js')

class LongPollConnection extends EventEmitter {
  constructor (lpSettings, vk) {
    super()

    let self = this

    self.config = lpSettings
    self._vk = vk
    self.userListeners = {}

    self.supportEventTypes = {
      '4': 'message',
      '8': 'friendOnline',
      '9': 'friendOffline',
      '51': 'editChat',
      '61': 'typeInDialog',
      '62': 'typeInChat',
      '3': 'changeFlags'
    }

    self._middlewaresController = new EasyVKMiddlewares(self)

    init()

    async function reconnect () {
      return self._vk.call('messages.getLongPollServer', self.config.userConfig.forGetLongPollServer).then((vkr) => {
        self.config.longpollServer = vkr.server
        self.config.longpollTs = vkr.ts
        self.config.longpollKey = vkr.key

        return init() // reconnect with new parameters
      }).catch((err) => {
        self.emit('reconnectError', new Error(err))
      })
    }

    async function init () {
      let server, forLongPollServer, _w
      let httpsPref = 'https://'

      if (self.config.longpollServer.substr(0, httpsPref.length) !== httpsPref) {
        self.config.longpollServer = httpsPref + self.config.longpollServer
      }

      server = `${self.config.longpollServer}`

      forLongPollServer = {}
      _w = null

      forLongPollServer.act = 'a_check'
      forLongPollServer.key = self.config.longpollKey
      forLongPollServer.ts = self.config.longpollTs
      forLongPollServer.mode = self.config.userConfig.forLongPollServer.mode
      forLongPollServer.version = self.config.userConfig.forLongPollServer.version
      forLongPollServer.wait = self.config.userConfig.forLongPollServer.wait

      if (isNaN(forLongPollServer.mode)) {
        forLongPollServer.mode = 8 | 2
      }

      if (isNaN(forLongPollServer.version)) {
        forLongPollServer.version = '2'
      }

      _w = Number(forLongPollServer.wait)

      let params = {
        timeout: (_w * 1000) + (1000 * 3),
        headers: {
          'connection': 'keep-alive',
          'content-type': 'application/x-www-form-urlencoded'
        },
        agent: self._vk.agent,
        method: 'GET'
      }

      server = server + '?' + qs.stringify(forLongPollServer)

      self._debug({
        type: 'longPollParamsQuery',
        data: params
      })

      self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
        url: server,
        query: forLongPollServer,
        method: 'GET',
        section: 'longpoll'
      })

      self.lpConnection = fetch(server, params).then(async (res) => {
        res = await res.json()

        if (self._vk._debugger) {
          try {
            self._vk._debugger.push('response', res)
          } catch (e) {
            // Ignore
          }
        }

        self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, { body: res, section: 'longpoll' })

        self._debug({
          type: 'pollResponse',
          data: res
        })

        let vkr = res

        if (vkr.ts) {
          if (vkr.ts) {
            self.config.longpollTs = vkr.ts
          }

          if (vkr.updates && vkr.updates.length) {
            vkr.updates.forEach((upd, i) => {
              vkr.updates[i] = {
                type: upd[0],
                object: upd
              }
            })

            self._middlewaresController.run(vkr).then(() => {
              self._checkUpdates(vkr.updates)
            })
          }

          return init()
        }

        if (vkr.failed) {
          if (vkr.failed === 1) { // update ts
            if (vkr.ts) {
              self.config.longpollTs = vkr.ts
            }

            return init()
          } else if ([2, 3].indexOf(vkr.failed) !== -1) { // need reconnect
            self._vk.call('messages.getLongPollServer', self.config.userConfig.forGetLongPollServer).then((vkr) => {
              self.config.longpollServer = vkr.server
              self.config.longpollTs = vkr.ts
              self.config.longpollKey = vkr.key

              return init() // reconnect with new parameters
            }).catch((err) => {
              self.emit('reconnectError', new Error(err))
            })
          } else {
            return self.emit('failure', vkr)
          }
        }

        if (vkr.error) {
          self.emit('error', vkr.error)
          return reconnect()
        }
      }).catch(e => {
        self.emit('error', e)
      })
    }
  }

  async _debug () {
    if (this._debugg) {
      this._debugg(...arguments)
    }
  }

  async _checkUpdates (updates) {
    let self = this

    let len = updates.length

    for (let updateIndex = 0; updateIndex < len; updateIndex++) {
      let typeEvent = updates[updateIndex].type.toString()

      self.emit('update', updates[updateIndex].object)
      if (self.supportEventTypes[typeEvent]) {
        typeEvent = self.supportEventTypes[typeEvent]
        self.emit(typeEvent, updates[updateIndex].object)
      }

      try {
        if (self.userListeners[typeEvent]) {
          self.userListeners[typeEvent](updates[updateIndex].object)
        }
      } catch (e) {
        self.emit('error', e)
      }
    }
  }

  /**
   *
   *  If my SDK not support certain event it doesn't mean that my SDK not support it :D
   *  You can add yours listeners with this function.
   *
   *  Docs: vk.com/dev/using_longpoll
   *
   *  @param {Number} eventCode number of event which you can find on the docs page
   *  @param {Function} handler is a handler function
   *
   */

  async addEventCodeListener (eventCode, handler) { // Only for create new event listeneres (if there are not in default listeners, you can get a code and add it!)
    let self = this

    return new Promise((resolve, reject) => {
      if (isNaN(eventCode)) {
        return reject(self._vk._error('is_not_number', {
          'where': 'LongPoll.addEventCodeListener',
          'parameter': 'eventCode'
        }))
      } else if (Object.prototype.toString.call(handler) !== '[object Function]') {
        return reject(self._vk._error('is_not_function', {
          'where': 'LongPoll.addEventCodeListener',
          'parameter': 'handler'
        }))
      } else {
        eventCode = eventCode.toString()

        if (!self.supportEventTypes[eventCode]) {
          self.supportEventTypes[eventCode] = eventCode
          self.userListeners[eventCode] = handler
        } else {
          return reject(self._vk._error('longpoll_api', {}, 'event_already_have'))
        }
      }
    })
  }

  async close () {
    let self = this

    return new Promise((resolve, reject) => {
      if (self.lpConnection) {
        self.emit('close', {
          time: new Date().getTime()
        })

        return resolve(self.lpConnection.abort())
      } else {
        return reject(self._vk._error('longpoll_api', {}, 'not_connected'))
      }
    })
  }

  debug (debugg) {
    let self = this

    console.warn('[Deprecated method warning] \nThis method will be deprecated in next releases. Please, use new easyvk.Debugger() and set it up in the easyvk configuration like params.debug = myDebugger')

    if (Object.prototype.toString.call(debugg).match(/function/i)) {
      self._debugg = debugg
    } else {
      return false
    }

    return self
  }
}

class LongPollConnector {
  constructor (vk) {
    let self = this // For the future
    self._vk = vk
  }

  async connect (params = {}) {
    let self = this

    return new Promise((resolve, reject) => {
      if (!staticMethods.isObject(params)) {
        return reject(self._vk._error('is_not_object', {
          'where': 'LongPoll.connect',
          'parameter': 'params'
        }))
      } else {
        if (params.forGetLongPollServer) {
          if (!staticMethods.isObject(params.forGetLongPollServer)) {
            params.forGetLongPollServer = {}
          }
        } else {
          params.forGetLongPollServer = {}
        }

        if (params.forLongPollServer) {
          if (!staticMethods.isObject(params.forLongPollServer)) {
            params.forLongPollServer = {}
          }
        } else {
          params.forLongPollServer = {}
        }

        if (isNaN(params.forGetLongPollServer.lp_version)) {
          params.forGetLongPollServer.lp_version = '2'
        }

        if (isNaN(params.forLongPollServer.wait)) {
          params.forLongPollServer.wait = '25'
        }

        if (params.forGetLongPollServer.use_ssl !== 0) {
          params.forGetLongPollServer.use_ssl = 1
        }

        self._vk.call('messages.getLongPollServer', params.forGetLongPollServer)
          .then((vkr) => {
            let forLongPoll = {
              longpollServer: vkr.server,
              longpollTs: vkr.ts,
              longpollKey: vkr.key,
              responseGetServer: vkr,
              userConfig: params
            }

            let con = new LongPollConnection(forLongPoll, self._vk)

            return resolve(con)
          }, reject)
      }
    })
  }
}

module.exports = LongPollConnector
