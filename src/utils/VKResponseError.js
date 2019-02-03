
// This is an object error for know: code, message, desciption and other information from stack

class VKResponseError extends Error {
  constructor (message, code = 0, request = {}) {
    super(message) // generate message

    this.error_code = code
    this.request_params = request
    this.error_msg = message || code
    this.name = 'VKResponseError'
    // done
  }
}

module.exports = VKResponseError
