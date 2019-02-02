/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const currentSessionFile = path.join(__dirname, '.vksession')

/**
 *
 *  This test run your own bot for group with keyboard support
 *  For run it you need enable LongPoll in your group and then get access_token
 *  After this, put your access_token in {acess_token} parameter
 *  And then run it. Send messge to your bot, he will reply on it ith keyboard interface!
 *
 */

function longPollDebugger ({ type, data }) {
  // Debug all steps on the poll step
  console.log(`[typeLog ${type}]`, data)
}

easyVK({
  api_v: '5.73',
  save_session: false,
  session_file: currentSessionFile,

  // Access token whcch you need get from your group settings
  access_token: '{GROUP_ACCESS_TOKEN}',
  reauth: true
}).then(vk => {
  const session = vk.session

  console.info(`Running a LongPoll server.... \nwith group named as ("${session.group_name}")`)

  // LongPoll for Bots
  const LPB = vk.bots.longpoll

  return LPB.connect({
    forGetLongPollServer: {
      group_id: session.group_id // Group id, getting from session auth
    },
    forLongPollServer: {
      wait: 10 // Need wait for one poll 10 seconds
    }
  })
}).then(({ connection, vk }) => {
  connection.debug(longPollDebugger)

  // Keyboard objet for user interface
  // For work it you need enable LongPoll version >= 5.80 in group settings
  const keyboardObject = {
    one_time: false,
    buttons: [
      [
        {
          action: {
            type: 'text',
            label: 'start',
            payload: '{"command": "start"}'
          },
          color: 'default'
        }
      ]

    ]
  }

  async function messageNew (msgEvent) {
    if (!msgEvent.user_id && msgEvent.from_id) msgEvent.user_id = msgEvent.from_id

    let payload = msgEvent.payload

    try {
      payload = JSON.parse(payload)
    } catch (e) {
      // Ignore
    }

    await (vk.call('messages.send', {
      user_id: msgEvent.user_id,
      message: ((payload) ? 'Button started' : 'Reply it'),
      keyboard: keyboardObject
    }), 'post') // Only post requests recommend
  }

  connection.on('message_new', messageNew)

  /*
   *
   * In the next release this listeners will be one listener
   * And one-debugger will too
   *
   */

  connection.on('error', console.error)
  connection.on('failure', console.error)

  // LongPoll needs auto-reconnect for support one connection without stopping program
  // Sure i am added this featture and if error uccurs on recconect step you will catch it by this method
  connection.on('reconnectError', console.error)

  return true
}).catch(console.error)

// Handle all rejects and errors
process.on('unhandledRejection', console.error)
