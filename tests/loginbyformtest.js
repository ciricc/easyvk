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
 * This example gets the views count from videoSourceId and then sends it to user with id me
 *
 */

easyVK({
	api_v: '5.73',
	session_file: currentSessionFile,
	username: '{LOGIN_HERE}',
	password: '{PASSWORD_HERE}',
	reauth: true,
	lang: "ru"
}).then((vk) => {

	const Widgets = vk.http
	
	Widgets.loginByForm().then(({client}) => {
		//You can read stories and other
		
		client.readStories('497395239').then(({vk, count}) => {
			console.log(count);
		});

	});

}).catch(console.error);


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
