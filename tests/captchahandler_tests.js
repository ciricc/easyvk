const easyVK = require('../index.js')
const readline = require('readline');


/**
 *
 *  This test shows you how you can handle captcha error
 *  You can use ruCaptcha for solve it
 *  Or just send in messages with image of captcha for solve it by users
 *  Or create you interface for solving captcha in web, like: open browser: input key: send key
 *
 */


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const currentSessionFile = `${__dirname}/.vksession`


const captchaHandler = ({captcha_sid, captcha_img, resolve, vk}) => {
		
	//Stop sending messages, vk is EasyVK object
	vk.captcha_stop = true;

	rl.question(`Enter captcha for ${captcha_img} `, (key) => {
		
		//When got a key (message from stdin)
		//Try solve it with resolve method
		resolve(key).then(() => {

			//If solved correctly
			vk.captcha_stop = false
		})

	});
}

easyVK({
	api_v: '5.73',
	// save_session: false,
	session_file: currentSessionFile,

	//Access token whcch you need get from your group settings
	username: '{LOGIN_FIELD}',
	password: '{PASSWORD_FIELD}',
	
	captchaHandler: captchaHandler

}).then((vk) => {

	const me = 356607530
	const interval = 700 //DDOS, catch captcha

	setInterval(() => {
		
		//If no need solve captche, sending messages ....
		if (!vk.captcha_stop) {
			
			return vk.call('messages.send', {
				user_id: me,
				message: 'Test it!'
			})

		}

	}, interval)

}).catch(console.error)


//Handler all rejects and errors
process.on('unhandledRejection', console.error)