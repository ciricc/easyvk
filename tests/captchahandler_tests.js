/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const readline = require('readline')

/**
 *
 *  This test shows you how you can handle captcha error
 *  You can use ruCaptcha for solve it
 *  Or just send in messages with image of captcha for solve it by users
 *  Or create you interface for solving captcha in web, like: open browser: input key: send key
 *
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const currentSessionFile = path.join(__dirname, '.vksession')

const captchaHandler = ({ captcha_sid: captchaSid, captcha_img: captchaImg, resolve: solve, vk }) => {
  // Stop sending messages, vk is EasyVK object
  vk.captcha_stop = true

  // You can download image by captcha_img url
  // Then solve it by ruCaptcha service (not free) or just send it to you for solving

  rl.question(`Enter captcha for ${captchaImg} `, (key) => {
    // When got a key (message from stdin)
    // Try solve it with resolve method
    solve(key).then(() => {
      // If solved correctly
      vk.captcha_stop = false

      console.log('Captcha solved correctly!')
    }).catch(({ err, reCall: tryNewCall }) => {
      // Or if captcha not solved correctly
      console.log('Captcha not solved correctly!!!\nTry recall', err)
      tryNewCall()
    })
  })
}

easyVK({
  api_v: '5.73',
  // save_session: false,
  session_file: currentSessionFile,

  // Access token whcch you need get from your group settings
  username: '{LOGIN_FIELD}',
  password: '{PASSWORD_FIELD}',
  reauth: true,
  captchaHandler: captchaHandler

}).then((vk) => {
  const me = 356607530
  const interval = 700 // DDOS, catch captcha
  // (joke, it's not a DDOS, but many requests per minute call a captcha error)

  let i = 0

  setInterval(() => {
    // If no need solve captche, sending messages ....
    if (!vk.captcha_stop) {
      i++

      console.log(`Sending message [${i}]`)
      return vk.call('messages.send', {
        user_id: me,
        message: 'Test it!'
      })
    }
  }, interval)
}).catch(console.error)

// Handler all rejects and errors
process.on('unhandledRejection', console.error)
