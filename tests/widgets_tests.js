/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


const currentSessionFile = path.join(__dirname, '.vksession')

/*
 *
 * This test is testing all my widgets, for example: getLiveViews
 * This example gets the views count from videoSourceId and then sends it to the user with id me
 *
 */

easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	//Access token that you need to get from your group settings
	access_token: '{TOKEN_HERE}',
}).then((vk) => {

	console.log('Authenticated!');

	const Widgets = vk.widgets
	const interval = 8000
	const me = 356607530
	const videoSourceId = '5088687_456239369' //From url, for example:
	// https://vk.com/video?z=video<!![-156373163_456239058]!!>%2F20f2c18b0457ec2a84%2Fpl_cat_games

	async function sendToMe ({message}) {
		return vk.call('messages.send', { //Standard method to send messages
			user_id: me,
			message: message
		})	
	}

	async function sendViewsToMe () {
		const getViews = Widgets.getLiveViews(videoSourceId)

		const views = await getViews

		console.log(views);
		
		if (views != 0) {
			await sendToMe({
				message: `Current views (Bot): ${views}`
			})
		}
	}

	setInterval(sendViewsToMe, interval)

}).catch(console.error)


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
