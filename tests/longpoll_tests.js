/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)



const currentSessionFile = path.join(__dirname, '.vksession')

/**
 *
 *  This test runs your own bot for a group
 *  To run it you need to enable LongPoll in your group and then get an access_token
 *  After this, put your access_token in the {acess_token} parameter
 *  And then run it. Send a message to your bot and he will reply to it!
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
	access_token: '{TOKEN_HERE}',
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
			wait: 10 //Need wait 10 seconds for one poll
		}
	})

}).then(({connection, vk}) => {
	connection.debug(longPollDebugger);

	async function messageNew (msgEvent) {
		
		if (!msgEvent.user_id && msgEvent.from_id) msgEvent.user_id = msgEvent.from_id;

		await (vk.call('messages.send', {
			user_id: msgEvent.user_id,
			message: 'Reply it'
		}));
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



	const LPU = vk.longpoll


	//Connecting to the user longpoll to create a group bot :D
	return LPU.connect({
	    forGetLongPollServer: {
	        lp_version: "2",
	        need_pts: "1",
	    }
	})

}).then(({connection: userLongPollConnection, vk}) => {

	console.log(userLongPollConnection.config.userConfig.forGetLongPollServer.need_pts)

	//Debug useLongPollConnection
	userLongPollConnection.debug(longPollDebugger)
	
	//Test addEventCodeListener method, flags message
	userLongPollConnection.addEventCodeListener(3, (event) => { 
	    console.info('[Message flags changes] ========== ', event);
	}).catch(console.error);
	
	async function messageNew (msgEvent) {
		
		const getMessage = vk.call('messages.getById', {
			message_ids: [msgEvent[1]]
		})

		 

		const msg = (await getMessage).vkr.response.items[0]


		if (!msg.out) {

			/*
			 *
			 *  It would work if you put a group token not a user (group admin) token
			 *  If you put a group token, it will send a message
			 *
			 */

			const sendMessage = vk.call('messages.send', { 
				user_id: msg.user_id,
				message: 'Reply it from User LongPoll system o/'
			})

			await sendMessage
		}


	}


	userLongPollConnection.on('message', messageNew)



	//Error handlers
	userLongPollConnection.on('failure', console.error)
	userLongPollConnection.on('error', console.error)
	userLongPollConnection.on('reconnectError', console.error)


}).catch(console.error)

//Handler for all rejections and errors
process.on('unhandledRejection', console.error)


