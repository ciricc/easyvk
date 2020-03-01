class EasyVKError extends Error {
  constructor (error, name = '', data = {}) {
    super(error.description)

    let self = this

    self.error_code = error.code
    self.easyvk_error = true
    self.data = data
    self.name = name
  }
}

class EasyVKErrors {
  constructor () {
    let self = this

    let errors = {}

    errors = require('./evkerrors')

    self._errors = errors
  }

  error (name = '', data = {}, parent = '') {
    let self = this

    name = String(name)
    parent = String(parent)

    if (self._errors[name]) {
      let err

      if (self._errors[name]['errors'] && self._errors[name]['errors'][parent]) {
        err = self._errors[name]['errors'][parent]
        err.code += (self._errors[name]['parent_hash'] || -100000)
      } else {
        err = self._errors[name]
      }

      if (err[self._lang + '_description']) {
        err.description = err[self._lang + '_description']
      }

      let stringId = name

      if (self._errors[name]['errors'] && self._errors[name]['errors'][parent]) {
        stringId = name + '\\' + parent
      }

      return new EasyVKError(err, stringId, data)
    }

    let notHaveError = 'Not have this error in EasyVKErrors object!'

    if (self._lang === 'ru') {
      notHaveError = 'Данная ошибка не описана в объекте EasyVKErrors'
    }

    return new Error(notHaveError)
  }

  setLang (lang = 'ru') {
    let self = this

    self._lang = String(lang)
  }
}

module.exports = new EasyVKErrors()
module.exports.EasyVKError = EasyVKError
