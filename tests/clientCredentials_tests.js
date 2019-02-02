/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

/*
 *
 *  This tests shows you, how you can use platform for authenticate user
 *  Started from 1.4.2 version you can user own client_id and client_secret of application
 *  For authentication user by password and username
 *
 *  So, you can user debuggerRun for debug easyvk before initialize
 *  and authentication
 *
 */

// Fixed version parameter
console.log(easyVK.version)

easyVK.debuggerRun.on('push', ({ type, data }) => {
  // Type if type of log: response
  // Data is data of log event
  console.log(data)
})

easyVK({

  /*
   *  You can use platform parameter for change session platform
   *  Correct values: [Android, IOS, Windows, iOs, AndRoId, wINDows etc..]
   *  Or use platform id: {
      "6": "WINDOWS",
      "2": "IOS",
      "4": "ANDROID"
    };
   *
   */

  // platform: "Android",

  // This parameters only for authenticate user by password and username
  // It doesnt get access_token of your application!!
  client_id: '3697615',
  client_secret: 'AlVXZFMUqyrnABp8ncuU',

  // Updated API version
  api_v: '5.75',

  // user data
  username: '{USERNAME_FIELD}',
  password: '{PASSWORD_FIELD}',

  // other
  reauth: true,
  save_session: false
}).then((vk) => {
  // EasyVKSession object
  console.log(vk.session)
}).catch(console.error)

// Handle all rejects and errors
process.on('unhandledRejection', console.error)
