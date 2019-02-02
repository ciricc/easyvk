/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const serverPort = (process.env.PORT || 80)

easyVK.callbackAPI.listen({
  groups: [
    {
      groupId: '{GROUP_ID_EXAMPLE_1}',
      secret: '{YOUR_GROUP_SECRET_PASSWORD}',
      confirmCode: '{YOUR_GROUP_CONFIRMATION_CODE}'
      // If it need, in next release it will be take from groups.getCallbackConfirmationCode method
    }

    // {}, {}, .... , {},
  ],

  port: serverPort

}).then(({ connection, web }) => {
  // web.app, web.server - variables of server, express

  console.log(`Run a server on 127.0.0.1:${serverPort}`)

  const errorEvents = [
    'secretError',
    'eventEmpty',
    'confirmationError'
  ]

  errorEvents.forEach((eventName) => {
    connection.on(eventName, ({ postData, description }) => {
      console.error(description)
      console.log(`Errored here [${postData}]`)
    })
  })

  connection.on('message_new', console.log)

  /**
   *
   *   If you authenticated by easyVK() function, then you cn call to methods by .call() method
   *   But if is not, then you need use staticMethods for do this
   *
   *   easyVK.staticMethods.call('messages.send', {
   *    access_token: '{YOUR_ACCESS_TOKEN}'
   *   }).then(() => {
     *
   *   })
   *
   */
}).catch(console.error)

// Handle all rejects and errors
process.on('unhandledRejection', console.error)
