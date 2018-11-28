/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyvk = require(`${_easyvk}`)



const currentSessionFile = path.join(__dirname, '.vksession')


easyvk({
	client_id: '{APP_SECRET_CODE}',
	client_secret: '{CLIENT_SECRET_CODE}',
	reauth: true,
}).then((vk) => {

	const StreamingAPI = vk.streamingAPI

	return StreamingAPI.connect().then(({connection}) => {

		connection.getRules().then(({vkr}) => {
			console.log(vkr.rules);
		});

		connection.on("post", console.log)

	});

});