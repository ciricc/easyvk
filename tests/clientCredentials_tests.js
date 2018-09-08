/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const readline = require('readline');

/*
 * 
 *  This tests shows you, how to use 'platform' parameter in user authentication
 *  Starting from version 1.4.2 you can use your own client_id and client_secret
 *  
 *  You can use debuggerRun to enable debug for easyvk before initialization
 *  and authentication
 *
 */


//Fixed version parameter
console.log(easyVK.version);

easyVK.debuggerRun.on("push", ({type, data}) => {
	
	//Type is the type of log: response
	//Data is data of the log event
	console.log(data);

});

easyVK({
	
	/*
	 *  You can use 'platform' parameter to change session platform
	 *  Correct values: [Android, IOS, Windows, iOs, AndRoId, wINDows etc..]
	 *  Or use platform id: {
			"6": "WINDOWS",
			"2": "IOS",
			"4": "ANDROID"
		};
	 *
	 */

	//platform: "Android",
	
	//This parameters are only for authentication password and username
	//It doesnt get access_token of your application!!
	client_id: '3697615',
	client_secret: 'AlVXZFMUqyrnABp8ncuU',

	//Updated API version
	api_v: '5.75',

	//user data
	username: '{USERNAME_HERE}',
	password: '{PASSWORD_HERE}',

	//other
	reauth: true,
	save_session: false
}).then((vk) => {

	//EasyVKSession object
	console.log(vk.session);

}).catch(console.error);


//Handler for all rejections and errors
process.on('unhandledRejection', console.error);
