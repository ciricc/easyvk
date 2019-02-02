const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const currentSessionFile = path.join(__dirname, '.vksession')

easyVK({
  access_token: '{TOKEN}',
  save_session: false,
  session_file: currentSessionFile,
  lang: 'ru',
  reauth: true,
  fields: ['photo_200', 'photo_400', 'photo_600', 'last_seen', 'screen_name']
  // or:  fields: "photo_200,last_seen,screen_name"
}).then(async (vk) => {
  console.log(vk.session)
}).catch(console.error)

// Handle all rejects and errors
process.on('unhandledRejection', console.error)
