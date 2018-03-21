const easyVK = require('../index.js')



const currentSessionFile = `${__dirname}/.vksession`;

/**
 *
 *  This test run your own bot for group
 *  For run it you need enable LongPoll in your group and then get access_token
 *  After this, put your access_token in {acess_token} parameter
 *  And then run it. Send messgeto your bot, he will reply on it!
 *
 */

function longPollDebugger({type, data}) {
	//Debug all steps on the poll step
	console.log(`[typeLog] ${type}`, data);
}

easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	//Access token whcch you need get from your group settings
	access_token: '{TOKEN_FIELD}',
}).then(vk => {


	const session = vk.session
	
	console.info(`Running a LongPoll server.... \nwith group named as ("${session.group_name}")`)

	//LongPoll for Bots
	const LPB = vk.bots.longpoll

	return LPB.connect({
		forGetLongPollServer: {
			group_id: session.group_id //Group id, getting from session auth
		},
		forLongPollServer: {
			wait: 10 //Need wait for one poll 10 seconds
		}
	})

}).then(({connection, vk}) => {
	connection.debug(longPollDebugger);

	async function messageNew (msgEvent) {
		await (vk.call('messages.send', {
			user_id: msgEvent.user_id,
			message: 'Reply it'
		}));
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

	//LongPoll needs auto-reconnect for support one connection without stopping program
	//Sure i am added this featture and if error uccurs on recconect step you will catch it by this method
	connection.on('reconnectError', console.error)



	const LPU = vk.longpoll

	//Connect to user longpoll for create group bot :D
	return LPU.connect()

}).then(({connection: userLongPollConnection, vk}) => {

	//Debug useLongPollConnection
	userLongPollConnection.debug(longPollDebugger)
	
	
	async function messageNew (msgEvent) {
		
		const getMessage = vk.call('messages.getById', {
			message_ids: [msgEvent[1]]
		})

		 

		const msg = (await getMessage).response.items[0]


		if (!msg.out) {

			/*
			 *
			 *  It will be work if you really puted a group token not user token which admins this group
			 *  If you put this token, it will be sended
			 *
			 */

			const sendMessage = vk.call('messages.send', { 
				user_id: msg.user_id,
				message: 'Replay it from User LongPoll system'
			})

			await sendMessage
		}


	}


	userLongPollConnection.on('message', messageNew)



	//Handler errors
	userLongPollConnection.on('failure', console.error)
	userLongPollConnection.on('error', console.error)
	userLongPollConnection.on('reconnectError', console.error)


}).catch(console.error)


//Handle all rejects and errors
process.on('unhandledRejection', console.error)