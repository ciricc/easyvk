const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


const currentSessionFile = path.join(__dirname, '.vksession')



easyVK({
	access_token: '{TOKEN_HERE}',
	save_session: false,
	session_file: currentSessionFile,
	lang: "ru"
}).then(vk => {

	vk.saveSession();
	
	return  vk.call('messages.send', 
		{
			// message: 'Test message!',
			user_id: (vk.session.user_id || 1)
		})
	.then(console.log)


}).catch(console.error)


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
