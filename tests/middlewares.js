/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const evk = require(`${_easyvk}`)

const currentSessionFile = path.join(__dirname, '.vksession')

/**
 *
 *  This test run your own bot for group
 *  For run it you need enable LongPoll in your group and then get access_token
 *  After this, put your access_token in {acess_token} parameter
 *  And then run it. Send messgeto your bot, he will reply on it!
 *
 */

evk({
  session_file: currentSessionFile,
  access_token: '{USER_TOKEN}',
  reauth: true
}).then(vk => {
  vk.use(async ({ thread, next }) => {
    if (thread.method === 'messages.send') {
      thread.methodType = 'post' // Автоматически меняем типа запроса на POST

      if (Number(thread.query.v) >= 5.90) {
        // Для новых версий API ВКонтакте для сообщений трубет поля random_id (уникальный id сообщения)

        thread.query.random_id =
          new Date().getTime().toString() + '' + (Math.floor(Math.random() * 1000)).toString()
      }
    }

    // Запускаем следующий плагин
    await next()
  })

  vk.call('messages.send', {
    peer_id: vk.session.user_id,
    message: 'Hello!',
    v: '5.90'
  })

  vk.longpoll.connect().then(({ connection }) => {
    // Simple longpoll connection plugin for new updates
    connection.use(async ({ next, thread }) => {
      thread.updates.forEach((upd, i) => {
        if (upd.type === 4) {
          upd.object = {
            out: upd.object[2] & 2,
            peer_id: upd.object[3],
            text: upd.object[5],
            payload: upd.object[6].payload || {}
          }
        }
      })

      await next()
    })

    connection.use(async ({ next, thread }) => {
      console.log(thread.updates, 'i am on second')
    })

    connection.on('message', console.log)

    console.log(connection)
  })
}).catch(e => {
  console.log(e)
})

process.on('unhandledRejection', console.log)
