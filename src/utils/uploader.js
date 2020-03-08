
/*
 *
 *  This util contents all upload functions and working with files
 *  (Only for upload)
 *  Author: @ciricc
 *  License: MIT
 */

'use strict'

const fs = require('fs')
const fetch = require('node-fetch')
const mime = require('mime-types')

const staticMethods = require('./staticMethods.js')
const path = require('path')
const FormData = require('form-data')

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

      if (!filename) {
        return reject(this._vk._error('is_not_string', {
          parameter: 'fileUrl.name',
          method: 'uploadFile',
          format: 'example.jpeg or example.rar'
        }))
      }

      return fetch(fetchingFileUrl, {
        agent: this._agent
      }).then(async (res) => {
        let buff = await res.buffer()

        let form = new FormData()

        form.append(fieldName, buff, {
          filename: fieldName + '.' + mime.extension(res.headers.get('content-type') || 'text/plain')
        })

        return fetch(url, {
          method: 'POST',
          body: form,
          agent: this._agent
        }).then(async (response) => {
          let vkr = await response.json()

          if (vkr) {
            if (form.custom) {
              return resolve(vkr)
            } else {
              let json = staticMethods.checkJSONErrors(vkr, reject)

              if (json) {
                return resolve(vkr)
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
      data = new FormData()

      Object.keys(paramsUpload)
        .forEach((param) => {
          if (param !== fieldName) {
            data.append(param, paramsUpload[param])
          }
        })

      stream.on('error', (error) => {
        return reject(new Error(error))
      })

      stream.on('open', () => {
        data.append(fieldName, stream)
        return fetch(url, {
          method: 'POST',
          body: data,
          agent: self._agent,
          headers: data.getHeaders()
        }).then(async (response) => {
          let vkr = await response.json()

          if (vkr) {
            if (data.custom) {
              return resolve(vkr)
            } else {
              let json = staticMethods.checkJSONErrors(vkr, reject)

              if (json) {
                return resolve(vkr)
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
        }).catch(reject)
      })
    })
  }

  async upload ({
    getUrlMethod,
    saveMethod,
    file,
    getUrlParams = {},
    saveParams = {},
    uploadParams = {},
    isWeb = false,
    fieldName = 'file',
    uploadUrlField = 'upload_url'
  }, returnAll = false) {
    return this.getUploadURL(getUrlMethod, getUrlParams, true).then(({ vkr }) => {
      let url = vkr[uploadUrlField]
      let uploadMethod = isWeb ? 'uploadFetchedFile' : 'uploadFile'

      return this[uploadMethod](url, file, fieldName, uploadParams).then(vkr => {
        return this._vk.call(saveMethod, Object.assign(saveParams, vkr))
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

      self._vk.call(methodName, params).then((vkr) => {
        if (vkr.upload_url) {
          if (returnAll) {
            return resolve({
              url: vkr,
              vkr: vkr
            })
          } else {
            return resolve(vkr.upload_url)
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
