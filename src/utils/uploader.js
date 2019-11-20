
/*
 *
 *  This util contents all upload functions and working with files
 *  (Only for upload)
 *  Author: @ciricc
 *  License: MIT
 */

'use strict'

const fs = require('fs')
const request = require('request')
const staticMethods = require('./staticMethods.js')
const path = require('path')

class EasyVKUploader {
  constructor (vk) {
    let self = this
    self._vk = vk
  }

  /*
   *
   *  Function for upload file from other server only by fileUrl
   *
   */
  async uploadFetchedFile (url, fileUrl, fieldName = 'file', paramsUpload = {}) {
    return new Promise((resolve, reject) => {
      if (!url || !staticMethods.isString(url)) {
        return reject(this._vk._error('is_not_string', {
          parameter: 'url',
          method: 'uploadFetchedFile',
          format: 'http(s)://www.domain.example.com/path?request=get'
        }))
      }

      if (!fileUrl || (!staticMethods.isString(fileUrl) && !staticMethods.isObject(fileUrl))) {
        return reject(this._vk._error('is_not_string', {
          parameter: 'fileUrl',
          method: 'uploadFetchedFile',
          format: 'https://vk.com/images/community_100.png'
        }))
      }

      if (fieldName) {
        if (!staticMethods.isString(fieldName)) {
          return reject(this._vk._error('is_not_string', {
            parameter: 'fieldName',
            method: 'uploadFetchedFile',
            required: false
          }))
        }
      }

      if (!staticMethods.isObject(paramsUpload)) {
        paramsUpload = {}
      }

      if (staticMethods.isString(fileUrl)) {
        fileUrl = {
          url: fileUrl
        }
      }

      let fetchingFileUrl = fileUrl.url
      let filename = fileUrl.name || fetchingFileUrl.split('/').pop().split('#')[0].split('?')[0]
      let form = {}

      form = Object.assign(form, paramsUpload)

      if (!filename) {
        return reject(this._vk._error('is_not_string', {
          parameter: 'fileUrl.name',
          method: 'uploadFile',
          format: 'example.jpeg or example.rar'
        }))
      }

      request.get({
        url: fetchingFileUrl,
        followAllRedirects: true,
        agent: this._agent
      }, (err, res) => {
        if (err) {
          return reject(this._vk._error('server_error', {
            error: err
          }))
        }

        form[fieldName] = {
          value: request(fetchingFileUrl),
          options: {
            filename,
            contentType: res.headers['content-type']
          }
        }

        request.post({
          url: url,
          formData: form,
          agent: this._agent
        }, (err, response) => {
          if (err) {
            return reject(this._vk._error('server_error', {
              error: err
            }))
          }

          if (!response) response = {}

          let vkr = response.body

          if (vkr) {
            if (form.custom) {
              return resolve({
                vkr: vkr,
                vk: this._vk
              })
            } else {
              let json = staticMethods.checkJSONErrors(vkr, reject)

              if (json) {
                return resolve({
                  vkr: json,
                  vk: this._vk
                })
              } else {
                return reject(this._vk._error('invalid_response', {
                  response: response
                }))
              }
            }
          } else {
            return reject(this._vk._error('empty_response', {
              response: response
            }))
          }
        })
      })
    })
  }

  /*
   *
   *  Function for upload file from local machine
   *
   */
  async uploadFile (url, filePath, fieldName = 'file', paramsUpload = {}) {
    let self = this
    return new Promise((resolve, reject) => {
      if (!url || !staticMethods.isString(url)) {
        return reject(self._vk._error('is_not_string', {
          parameter: 'url',
          method: 'uploadFile',
          format: 'http(s)://www.domain.example.com/path?request=get'
        }))
      }

      if (!filePath || !staticMethods.isString(filePath)) {
        if (!(filePath instanceof fs.ReadStream)) {
          return reject(self._vk._error('is_not_string', {
            parameter: 'filePath',
            method: 'uploadFile',
            format: path.join(__dirname, '..', 'example', 'path')
          }))
        }
      }

      if (fieldName) {
        if (!staticMethods.isString(fieldName)) {
          return reject(self._vk._error('is_not_string', {
            parameter: 'fieldName',
            method: 'uploadFile',
            required: false
          }))
        }
      }

      if (!staticMethods.isObject(paramsUpload)) {
        paramsUpload = {}
      }

      let stream, data

      stream = (filePath instanceof fs.ReadStream) ? filePath : fs.createReadStream(filePath)
      data = {}

      Object.keys(paramsUpload)
        .forEach((param) => {
          if (param !== fieldName) {
            data[param] = paramsUpload[param]
          }
        })

      stream.on('error', (error) => {
        reject(new Error(error))
      })

      stream.on('open', () => {
        data[fieldName] = stream

        let _data = {}
        _data[fieldName] = stream

        request.post({
          url: url,
          formData: _data,
          agent: self._agent
        }, (err, response) => {
          if (err) {
            return reject(self._vk._error('server_error', {
              error: err
            }))
          }

          if (!response) response = {}

          let vkr = response.body

          if (vkr) {
            if (data.custom) {
              return resolve({
                vkr: vkr,
                vk: self._vk
              })
            } else {
              let json = staticMethods.checkJSONErrors(vkr, reject)

              if (json) {
                return resolve({
                  vkr: json,
                  vk: self._vk
                })
              } else {
                return reject(self._vk._error('invalid_response', {
                  response: response
                }))
              }
            }
          } else {
            return reject(self._vk._error('empty_response', {
              response: response
            }))
          }
        })
      })
    })
  }

  async getUploadURL (methodName, params = {}, returnAll = false) {
    let self = this

    return new Promise((resolve, reject) => {
      if (!staticMethods.isObject(params)) {
        return reject(self._vk._error('is_not_object', {
          parameter: 'params',
          method: 'getUploadURL'
        }))
      }

      self._vk.call(methodName, params).then(({ vkr, vk }) => {
        if (vkr.upload_url) {
          if (returnAll) {
            return resolve({
              url: vkr,
              vkr: vkr,
              vk: self._vk
            })
          } else {
            return resolve({
              url: vkr.upload_url,
              vk: vk
            })
          }
        } else {
          return reject(self._vk._error('upload_url_error', {
            response: vkr
          }))
        }
      }, reject)
    })
  }
}

module.exports = EasyVKUploader
