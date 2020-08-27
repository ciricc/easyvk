
import EventEmitter from 'events'

class EventContext {
  constructor (type, event = {}) {
    this.type = type
    this.moment = new Date()
    this.event = event
  }
  toString () {
    return `[${this.moment.toString()}]\n${this.message ? this.message : JSON.stringify(this, null, '  ')}`
  }
}

class Debugger extends EventEmitter {
  constructor (...props) {
    super(...props)

    this._onRequest = this._onRequest.bind(this)
    this._onResponse = this._onResponse.bind(this)

    this.on(Debugger._toRaw(Debugger.EVENT_RESPONSE_TYPE), this._onResponse)
    this.on(Debugger._toRaw(Debugger.EVENT_REQUEST_TYPE), this._onRequest)
  }

  static _toUpper (s) {
    return String(s).replace(/^(.*){0,1}/, x => x[0].toUpperCase() + x.slice(1))
  }

  static _toRaw (s) {
    return 'raw' + Debugger._toUpper(s)
  }

  _onResponse (responseEvent = {}) {
    return this.emit('response', new EventContext(Debugger.EVENT_RESPONSE_TYPE, responseEvent))
  }

  _onRequest (requestEvent = {}) {
    return this.emit('request', new EventContext(Debugger.EVENT_REQUEST_TYPE, requestEvent))
  }
}

export const EVENT_REQUEST_TYPE = 'request'
export const EVENT_RESPONSE_TYPE = 'response'

export default Debugger
