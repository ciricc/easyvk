let VKResponseReturner = function (staticMethods, dataResponse_, returnConstructor) {
  let response_ = dataResponse_

  let res = response_.response

  if (res === undefined || res === null) res = response_

  let constructorName = (res).constructor.name
  let Constructor = global[constructorName]

  if (!Constructor) Constructor = Object

  class VKResponse extends Constructor {
    constructor (res) {
      if ((staticMethods.isString(res) || !isNaN(res) || res instanceof Boolean) && constructorName !== 'Array') {
        super(res)
      } else if (Array.isArray(res) || constructorName === 'Array') {
        super(...res)
        res.forEach((a, i) => {
          this[i] = a
        })
      } else if (staticMethods.isObject(res)) {
        super()

        let self = this

        let _props = {
          response: res
        }

        let canChanged = ['response']

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
        for (let prop in self.response) {
          Object.defineProperty(self, prop, {
            enumerable: true,
            configurable: true,
            value: self.response[prop]
          })
        }
      } else {
        super(res)
      }

      return this
    }

    get vkr () {
      console.warn('[Warning] Vkr option is deprecated, use absolute .then(vkr => console.log(vkr))')
      return this
    }

    get vk () {
      console.warn('[Warning] Vk option is deprecated, use absolute .then(vkr => console.log(vkr))')
      return null
    }

    getFullResponse () {
      return response_
    }
  }

  if (returnConstructor) {
    return VKResponse
  }

  return new VKResponse(res)
}

module.exports = VKResponseReturner
