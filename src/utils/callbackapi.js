/*
 *  It's a Callbakc API module for EasyVK
 *  You can use it
 *
 *  Author: @ciricc
 *  License: MIT
 *
 */

'use strict'

const http = require('http')
const staticMethods = require('./staticMethods.js')
const EventEmitter = require('fast-event-emitter')
const bodyParser = require('body-parser')
const EasyVKMiddlewares = require('./middlewares.js')

class CallbackAPI extends EventEmitter {
  constructor (vk) {
    super()
    let self = this
    self._vk = vk
    self._middlewaresController = new EasyVKMiddlewares(self)
  }

  __initVKRequest (req, res) {
    let postData, self

    self = this
    postData = req.body

    if (!postData.group_id) {
      res.status(400).send('only vk requests')
      return self.emit('eventEmpty', {
        postData: postData,
        description: "This request haven't group_id of event. Event name is empty"
      })
    }

    let group = self._cbparams.groups[postData.group_id.toString()]

    if (postData.type === 'confirmation') {
      if (group) {
        if (group.secret) { // If you use a password fro menage it
          if (postData.secret && postData.secret.toString() === group.secret.toString()) {
            res.status(200).send(group.confirmCode)
          } else {
            res.status(400).send('secret error')
            self.emit('secretError', {
              postData: postData,
              description: 'We got the secret key which no uses in your settings! If you want to add secret, set up it in secret parameter!'
            })
          }
        } else {
          res.status(200).send(group.confirmCode)
        }
      } else {
        res.status(400).send('not have this group')
        self.emit('confirmationError', {
          postData: postData,
          description: "You don't use this group, becouse we don't know this groupId"
        })
      }
    } else if (postData.type !== 'confirmation') {
      if (group) {
        if (group.secret) {
          if (postData.secret && postData.secret.toString() !== group.secret.toString()) {
            res.status(400).send('secret error')
            self.emit('secretError', {
              postData: postData,
              description: 'Secret from request and from your settings are not the same'
            })

            return
          } else if (!postData.secret) {
            res.status(400).send('secret error')
            self.emit('secretError', {
              postData: postData,
              description: 'Request has not a secret password, but you use it in this group'
            })

            return
          }
        }

        if (postData.type) {
          self.emit(postData.type, postData)
          res.status(200).send('ok')
        } else {
          res.status(400).send('invalid type event')
          self.emit('eventEmpty', {
            postData: postData,
            description: "This request haven't type of event. Event name is empty"
          })
        }
      } else {
        res.status(400).send('not have this group')
        self.emit('confirmationError', {
          postData: postData,
          description: "You don't use this group, becouse we don't know this groupId"
        })
      }
    } else {
      res.status(400).send('only vk requests')
    }
  }

  __init404Error (req, res) {
    res.status(404).send('Not Found')
  }

  async __initApp (params = {}) {
    let self = this

    self._cbparams = params

    return new Promise((resolve, reject) => {
      let { app } = params
      let server

      if (!app) throw new Error('You must have app parameter, like express application')

      app.use(bodyParser.json())

      app.post(params.path, (req, res) => {
        self.__initVKRequest(req, res)
      })

      app.get(params.path, (req, res) => {
        self.__init404Error(req, res)
      })

      server = http.createServer(app)

      this._server = server
      server.listen(params.port || process.env.PORT || 3000)

      return resolve(true)
    })
  }
}

class CallbackAPIConnector {
  // Auto constructed by EasyVK
  constructor (vk) {
    let self = this
    self._vk = vk
  }

  /*
   *  This function is up your server for listen group events
   *
   *  @param {Object} callbackParams - Object for setup your server
   *  @param {Object[]} [callbackParams.groups] - Array of your groups which you want listen
   *  @param {String|Number} [callbackParams.groupId] - Group id which you want listen, if you use groups[] then it will be added too
   *  but you can't no input neither callbackParams.groups nor groupId and etc.
   *  You need select your group at least one way
   *  @param {String|Number} [callbackParams.confirmCode] - Your confirmation code. This code will be sended for confirmation query
   *  @param {String|Number} [callbackParams.secret] - Your secret code for one group, I am recommend you to use it for secure
   *  @param {String|Number} [callbackParams.port=(process.env.PORT || 3000)] - Port for http server, default is process.env.PORT || 3000
   *
   *  If you use many groups, you need separate (spread) groupId, secret and condirmCode parameters on objects in array of groups
   *  like { groups: [{groupId: ..., secret: ..., confirmCode: ...}, ...] }
   *
   *  @return {Promise}
   *  @promise up your server for listen group events
   *  @resolve {Object} - Object with web application, CallbackAPI connection object
   *  and EasyVK parameter:
   *  {vk: EasyVK, connection: CallbackAPI, web: expressApplication}
   *  @reject {Error} - express run and up server error
   *
   */

  async listen (callbackParams = {}) {
    let self = this

    return new Promise((resolve, reject) => {
      if (callbackParams) {
        if (!staticMethods.isObject(callbackParams)) {
          callbackParams = {}
        }
      }

      if (!Array.isArray(callbackParams.groups)) {
        callbackParams.groups = []
      }

      if (!callbackParams.groupId) {
        if (self._vk.session && self._vk.session.group_id) {
          callbackParams.groupId = self._vk.session.group_id
        }
      }

      if (callbackParams.groupId) { // If user wants only one group init
        if (!callbackParams.confirmCode && (self._vk.session && self._vk.session.group_id && callbackParams.groupId !== self._vk.session.group_id)) {
          return reject(new Error("You don't puted confirmation code"))
        }

        callbackParams.groups.push({
          confirmCode: callbackParams.confirmCode,
          groupId: callbackParams.groupId
        })

        if (callbackParams.secret) {
          callbackParams.groups[callbackParams.groups.length - 1].secret = callbackParams.secret
        }
      }

      if (callbackParams.groups.length === 0) {
        return reject(new Error('Select a group for listen calls'))
      } else {
        let grTemp = {}
        let registered = []

        callbackParams.groups.forEach(async (elem, index) => {
          let group = callbackParams.groups[index]

          if (!staticMethods.isObject(group)) {
            return reject(new Error(`Group settings is not an object (in ${index} index)`))
          }

          if (!group.groupId) {
            if (self._vk.session && self._vk.session.group_id) {
              group.groupId = self._vk.session.group_id
            }
          }

          if (!group.groupId || registered.indexOf(group.groupId) !== -1) {
            return reject(new Error(`Group id must be (groupId in ${index} index)`))
          }

          registered.push(group.groupId)

          if (!group.confirmCode) {
            if (self._vk.session && group.groupId === self._vk.session.group_id) {
              let confirmToken = await self._vk.call('groups.getCallbackConfirmationCode', {
                group_id: group.groupId
              })

              group.confirmCode = confirmToken.code
            }
          }

          if (!group.confirmCode) {
            return reject(new Error(`Confirmation code must be (confirmCode in ${index} index)`))
          } else {
            grTemp[group.groupId.toString()] = group
          }
        })

        callbackParams.groups = grTemp
      }

      if (!callbackParams.path) {
        callbackParams.path = '/'
      };

      let cbserver = new CallbackAPI(self._vk)

      cbserver.__initApp(callbackParams).then((app) => {
        return resolve(cbserver)
      })
    })
  }
}

module.exports = CallbackAPIConnector
