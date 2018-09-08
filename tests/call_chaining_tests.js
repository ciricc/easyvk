
/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


/*
 * 
 * This test shows you how to chaing all calls
 * If it works, it sends a message to a user with id 356607530 
 *
 */

const currentSessionFile = path.join(__dirname, '.vksession')

easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	//Access token that you need to get from your group settings
	access_token: '{TOKEN_HERE}',
}).then((vk) => {


	//Getting 2 users - me and a user with id 1
	return vk.call('users.get', {
		user_ids: [1, 356607530]
	})

}).then(({vkr, vk}) => {

	//Getting my id from response, not the variable
	const me = vkr.response[1].id



	//Logging response
	console.log('[Users] - ', vkr.response)


	return vk.call('messages.send', {
		user_id: me,
		message: 'Sample text! Lorem ipsum!'
	})

}).then(({vkr: messageSendedResponse, vk}) => {
	
	console.log(messageSendedResponse)

}).catch(console.error)


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
