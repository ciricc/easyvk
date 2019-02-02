'use strict'

const fs = require('fs')

class EasyVKSession {
  constructor (vk, dataSession = {}) {
    let self = this

    let _props = {
      session: dataSession,
      path: vk.params.session_file,
      vk: vk
    }

    let canChanged = ['path']

    for (let prop in _props) {
      let settings = {
        value: _props[prop]
      }

      if (canChanged.indexOf(prop) !== -1) {
        settings.configurable = true
      }

      Object.defineProperty(self, prop, settings)
    }

    // Use session data with methods
    for (let prop in self.session) {
      Object.defineProperty(self, prop, {
        enumerable: true,
        configurable: true,
        value: self.session[prop]
      })
    }

    return self
  }

  /*
   *  This method saved your session in file
   *
   *  @return {Promise}
   *
   */

  async save () {
    let self = this

    return new Promise((resolve, reject) => {
      let s

      if (!(self.path)) {
        return reject(self.vk._error('session', {}, 'need_path'))
      }

      s = JSON.stringify(self)

      let buf = Buffer.from(s, 'utf8')

      fs.writeFile(self.path, buf, (err) => {
        if (err) {
          return reject(new Error(err))
        }

        return resolve({
          vk: self.vk
        })
      })
    })
  }

  /*
   *  This function saves your session and cleaning it, make this empty
   *  @returns Promise
   *
   */

  async clear () {
    let self = this

    return new Promise((resolve, reject) => {
      for (let prop in self) {
        Object.defineProperty(self, prop, {
          value: undefined,
          enumerable: true,
          configurable: true
        })
      }

      self.save().then(resolve, reject)
    })
  }

  /*
   *  This function set up your path session, ou can change sesson path
   *
   *  @param {String} path is absolute path for you file
   *  @return {Promise}
   *
   */

  async setPath (path = '') {
    let self = this

    return new Promise((resolve, reject) => {
      fs.writeFile(path, '', (err) => {
        if (err) {
          return reject(err)
        }

        Object.defineProperty(self, 'path', {
          configurable: true,
          value: path
        })

        // Update for easyvk functions, for latest releases
        self.vk.params.session_file = path

        return resolve({
          vk: self.vk
        })
      })
    })
  }
}

module.exports = EasyVKSession
