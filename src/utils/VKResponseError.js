
// This is an object error for know: code, message, desciption and other information from stack

export default class VKResponseError extends Error {
  constructor (message, code = 0, request = {}, banInfo = null) {
    super(message) // generate message

    this.error_code = code
    this.request_params = request
    this.error_msg = message || code
    this.name = 'VKResponseError'
    this.ban_info = banInfo
  }
}
