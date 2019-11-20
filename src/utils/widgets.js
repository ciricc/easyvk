
/**
 *   In this file are widgets for EasyVK
 *   You can use it
 *
 *   Author: @ciricc
 *   License: MIT
 *
 */

'use strict'

const configuration = require('./configuration.js')
const staticMethods = require('./staticMethods.js')
const request = require('request')
const encoding = require('encoding')

const Debugger = require('./debugger.class.js')

class Widgets {
  // For call to methods an others, standard procedure
  constructor (vk) {
    let self = this
    self._vk = vk
  }

  async getLiveViews (videoSourceId = '') {
    let self = this

    return new Promise((resolve, reject) => {
      if (!videoSourceId || !staticMethods.isString(videoSourceId)) {
        return reject(self._vk._error('videoSourceId', {
          parameter: 'videoSourceId',
          method: 'widgets.getLiveViews',
          format: 'need format like -2222_22222 (from url)'
        }))
      }

      let headers, alVideoUrl, video, oid, vid, queryParams

      headers = {
        'origin': 'https://vk.com',
        'referer': `https://vk.com/video?z=video${videoSourceId}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.84 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest'
      }

      alVideoUrl = `${configuration.PROTOCOL}://${configuration.BASE_DOMAIN}/al_video.php`
      video = videoSourceId.split('_')
      oid = video[0]
      vid = video[1]

      let form = {
        'act': 'show',
        'al': 1,
        'autoplay': 0,
        'module': 'videocat',
        'video': videoSourceId
      }

      // Get specify hash for get permissions to watch
      queryParams = {
        url: alVideoUrl,
        headers: headers,
        form: form,
        encoding: 'binary',
        agent: self._vk.agent
      }

      self._vk.debug(Debugger.EVENT_REQUEST_TYPE, {
        url: alVideoUrl,
        query: form,
        method: 'POST',
        section: 'widgets'
      })

      request.post(queryParams, (err, res, vkr) => {
        res.body = encoding.convert(res.body, 'utf-8', 'windows-1251').toString()

        if (err) {
          return reject(new Error(err))
        }

        if (self._vk._debugger) {
          try {
            self._vk._debugger.push('response', res.body)
          } catch (e) {
            // ignore
          }
        }

        self._vk.debug(Debugger.EVENT_RESPONSE_TYPE, {
          body: res.body,
          section: 'widgets'
        })

        // Parsing hash from response body {"action_hash" : "hash"}
        let matCH = res.body.match(/("|')action_hash("|')(\s)?:(\s)?('|")(.*?)('|")/i)
        if (matCH) {
          let hash, getVideoViewsQueryParams

          hash = matCH[0].replace(/([\s':"])/g, '').replace('action_hash', '')

          getVideoViewsQueryParams = {
            url: `${alVideoUrl}?act=live_heartbeat`,
            body: `al=1&hash=${hash}&oid=${oid}&user_id=0&vid=${vid}`,
            encoding: 'binary', // Special
            headers: headers,
            agent: self._vk.agent
          }

          // Here is magic
          request.post(getVideoViewsQueryParams, (err, res) => {
            if (err) {
              return reject(new Error(err))
            }

            self._vk._debugger.push('response', res.body)

            let videoInfo = encoding.convert(res.body, 'utf-8', 'windows-1251').toString()

            videoInfo = videoInfo.toString()

            if (videoInfo.match('<!int>')) {
              let countViews = videoInfo.match('<!int>([0-9]+)<!>')

              if (countViews) {
                countViews = parseInt(countViews[1], 10)
                return resolve(countViews)
              } else {
                return reject(self._vk._error('live_error', {
                  video: video
                }))
              }
            } else {
              return reject(self._vk._error('live_error', {
                video: video
              }))
            }
          })
        } else {
          reject(self._vk._error('widgets', {
            video: video
          }, 'live_not_streaming'))
        }
      })
    })
  }
}

module.exports = Widgets
