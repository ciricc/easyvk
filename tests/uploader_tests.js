/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const currentSessionFile = path.join(__dirname, '.vksession')

const me = parseInt('356607530')
const myGroup = 162208999
const filePath = path.join(__dirname, '..', 'src', 'logo_200.png') // change on your file

easyVK({
  api_v: '5.73',
  save_session: false,
  session_file: currentSessionFile,

  reauth: true,

  // For this test need user authentication type
  username: '{LOGIN_FIELD}',
  password: '{PASSWORD_FIELD}'
}).then(async (vk) => {
  /*
   *
   * This test run all methods from methods list and get all upload_url's
   * So, if it work normally you will see log like 1 / 12 ... 3 / 12 .... 12 / 12, true
   * Where true is mean that response uequals url (ooooh...)
   * And you will se ONE ERROR <BECAUSE MY UPLOADER AND GETURL METHOD USE .call() METHOD
   * FOR GETTING URL, SO, ONE OF REQUESTS WILL WORK NORMALLY (It will send message to you, or, me)
   * AND THEN WILL OCCUR ERROR LIKE `upload_url is not defined in response`
   *
   * For work it you need create own group or just delete method where
   * defined group_id field in the object
   *
   *
   */

  async function getMyAlbumId () {
    return vk.call('photos.getAlbums', {
      owner_id: vk.session.group_id || vk.session.user_id
    })
  }

  const Uploader = vk.uploader
  const albumId = (await getMyAlbumId()).vkr.response.items[0].id

  // Will logged all urls (12)
  const methods = {
    'photos.getUploadServer': {
      album_id: albumId
    },
    'photos.getWallUploadServer': {
      album_id: albumId
    },
    'photos.getOwnerPhotoUploadServer': {
      album_id: albumId
    },
    'photos.getMessagesUploadServer': {},
    'photos.getChatUploadServer': {
      chat_id: 1
    },

    // Need enable marketplace on your group
    // else will not work
    'photos.getMarketUploadServer': {
      group_id: myGroup // You need put your group_id else it will be Access denied
    },
    'photos.getMarketAlbumUploadServer': {
      album_id: albumId,
      group_id: myGroup
    },
    'audio.getUploadServer': {},
    'video.save': {},
    'docs.getUploadServer': {},
    'docs.getWallUploadServer': {},
    'photos.getOwnerCoverPhotoUploadServer': {
      group_id: myGroup // You need put your group_id else it will be Access denied
    }
  }

  let i = 0

  // Will occured error like `upload_url` not defined

  vk.uploader.getUploadURL('messages.send', {
    message: 'Error, but it will sended, beacouse this method use .call() method for get URL !',
    user_id: me
  })

  /*
   *
   * This code getting all upload url and testing my method - getUploadURL
   *
   */

  for (let method in methods) {
    const params = methods[method]
    const { url } = await (Uploader.getUploadURL(method, params))

    if (url.length > 0) {
      i++
      console.log(`${i} / 12`)
    }
  }

  // true is `Return all response from vk`
  return vk.uploader.getUploadURL(
    'photos.getMessagesUploadServer', {}, true
  )
}).then(async ({ vk, url, vkr }) => {
  const Uploader = vk.uploader
  const field = 'photo'

  console.log(vkr === url) // true, beacouse you want get ALL REQUEST DATA

  url = url.response.upload_url

  // Get response from upload file for save it and then sending
  let { vkr: fileData } = await (Uploader.uploadFile(url, filePath, field, {}))
  fileData = await (vk.call('photos.saveMessagesPhoto', fileData))
  fileData = fileData.vkr.response[0]

  // Create attahcments
  const attahcments = [
    `photo${fileData.owner_id}_${fileData.id}_${fileData.access_key}`
  ]

  /*
   *
   * Sending message to me, will send file with message
   * `Hello! It tested normally!`
   *
   */

  return vk.call('messages.send', {
    user_id: me,
    attachment: attahcments,
    message: 'Hello! It tested normally!'
  })
}).then(({ vkr, vk }) => {
  console.log(vkr)
}).catch(console.error)

// Handler all rejects and errors
process.on('unhandledRejection', console.error)
