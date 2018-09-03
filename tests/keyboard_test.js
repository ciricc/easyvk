/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)



const currentSessionFile = path.join(__dirname, '.vksession')

/**
 *
 *  This test runs your own bot with keyboard support
 *  To run it you need to enable LongPoll in your group and then get an access_token
 *  After this, put your access_token in the {acess_token} parameter
 *  And then run it. Send a message to your bot and he will reply to it with a keyboard interface!
 *
 */

function longPollDebugger({type, data}) {
	console.log(`[typeLog ${type}]`, data);
}

easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	//Access token that you need to get from your group settings
	access_token: '{GROUP_ACCESS_TOKEN}',
	reauth: true
}).then(vk => {


	const session = vk.session
	
	console.info(`Running a LongPoll server.... \nwith group named ("${session.group_name}")`)

	//LongPoll for Bots
	const LPB = vk.bots.longpoll

	return LPB.connect({
		forGetLongPollServer: {
			group_id: session.group_id //Group id, getting from session auth
		},
		forLongPollServer: {
			wait: 10 //Need to wait 10 seconds for one poll
		}
	})

}).then(({connection, vk}) => {

	connection.debug(longPollDebugger);


	//Keyboard objet for user interface
	//For this to work you need to enable LongPoll version >= 5.80 in group settings
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
					color: "default"
				}
			]

		]
	}

	async function messageNew (msgEvent) {

		if (!msgEvent.user_id && msgEvent.from_id) msgEvent.user_id = msgEvent.from_id;

		let payload = msgEvent.payload;
		
		try {
			payload = JSON.parse(payload);
		} catch (e) {
			//Ignore
		}

		await (vk.call('messages.send', {
			user_id: msgEvent.user_id,
			message: ( (payload) ? "Button started" : 'Reply it'),
			keyboard: keyboardObject
		}), "post"); //Only POST requests recommended
	}


	connection.on('message_new', messageNew)

	/*
	 *
	 * In the next release these listeners will be put together to a main listener
	 * And a debugger listener
	 *
	 */

	connection.on('error', console.error)
	connection.on('failure', console.error)

	//LongPoll needs auto-reconnect to support one connection without restarting the program
	//So I added this feature and if an error occurs on reconection step you will catch it here
	connection.on('reconnectError', console.error)

	return true

}).catch(console.error)

//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
