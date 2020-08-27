import EventEmitter from 'events'

export class AbortSignal extends EventEmitter {
  constructor () {
    super()
    this.aborted = false
  }

  addEventListener (...args) {
    return this.on(...args)
  }

  removeEventListener (...args) {
    this.removeListener(...args)
    return this
  }
}

export class AbortController {
  constructor () {
    this.signal = new AbortSignal()
  }

  async abort () {
    this.signal.aborted = true
    return this.signal.emit('abort')
  }
}
