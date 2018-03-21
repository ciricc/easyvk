const easyVK = require('../index.js')


const currentSessionFile = `${__dirname}/.vksession`;

/*
 *
 * This test is testing all my wisgets, for example: getLiveViews
 * This example get views from videoSourceId and then send to user with id me
 *
 */

easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	//Access token whcch you need get from your group settings
	access_token: '{TOKEN_FIELD}',
}).then((vk) => {
	const Widgets = vk.widgets
	const interval = 8000
	const me = 356607530
	const videoSourceId = '-156373163_456239058'

	async function sendToMe ({message}) {
		return vk.call('messages.send', {
			user_id: me,
			message: message
		})	
	}

	async function sendViewsToMe () {
		const getViews = Widgets.getLiveViews(videoSourceId)

		const views = await getViews

		if (views != 0) {
			await sendToMe({
				message: `Current views (Bot): ${views}`
			})
		}
	}

	setInterval(sendViewsToMe, interval)

}).catch(console.error)


//Handle all rejects and errors
process.on('unhandledRejection', console.error)