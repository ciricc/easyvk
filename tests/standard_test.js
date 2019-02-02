const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const currentSessionFile = path.join(__dirname, '.vksession')

easyVK({
  access_token: 'f7f46cc4d923e6ca0cdea7b271bbf716f7946c0bbc39119d18ccdd8d209416509caa10d2b6376fe273eff',
  save_session: false,
  session_file: currentSessionFile,
  lang: 'ru',
  reauth: true
}).then(async (vk) => {
  console.log(vk.session)

  let group = await (vk.call('groups.getById', {
    group_ids: vk.session.group_id
  }))

  console.log(group.vkr, 'Is you..')

  let longPollParams = await (vk.call('messages.getLongPollServer', {
    group_id: vk.session.group_id
  }))

  console.log(
    longPollParams.vkr
  )

  return vk.call('messages.send',
    {
      message: 'Test message!',
      user_id: (vk.session.user_id || 356607530)
    })
    .then(({ vkr: vkr1 }) => {
      // let vkr1 = vkr;

      console.log(vkr1, 'vkr1')

      vk.call('messages.send',
        {
          message: 'Test message!',
          user_id: (vk.session.user_id || 356607530)
        })
        .then(({ vkr: vkr2 }) => {
          console.log(vkr2, 'vkr2')
          console.log(vkr1, 'vkr1')
        })
    })
}).catch(console.error)

// Handle all rejects and errors
process.on('unhandledRejection', console.error)
