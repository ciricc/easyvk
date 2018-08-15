/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


const currentSessionFile = path.join(__dirname, '.vksession')

/*
 *
 * This test is testing all my wisgets, for example: getLiveViews
 * This example get views from videoSourceId and then send to user with id me
 *
 */

easyVK({
	api_v: '5.73',
	session_file: currentSessionFile,
	//Access token whcch you need get from your group settings
	username: '{LOGIN_FIELD}',
	password: '{PASSWORD_FIELD}',
	reauth: true,
	lang: "ru"
}).then((vk) => {

	const Widgets = vk.http
	
	Widgets.loginByForm().then(({client}) => {
		//You can get read stories and other
		
		client.readStories('497395239').then(({vk, count}) => {
			console.log(count);
		});

	});

}).catch(console.error);


//Handle all rejects and errors
process.on('unhandledRejection', console.error)