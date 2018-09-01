/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const readline = require('readline');


/**
 *
 *  This test shows you how to handle a captcha error
 *  You can use ruCaptcha to solve it
 *  Or just send a messages with an image of the captcha so user can solve it
 *  Or create your own interface for solving captcha
 *
 */


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const currentSessionFile = path.join(__dirname, '.vksession')


const captchaHandler = ({captcha_sid, captcha_img, resolve:solve, vk}) => {
		
	//Stoping message sending
	//vk is an instance of EasyVK
	vk.captcha_stop = true;

	//You can download the image from captcha_img url
	//Solve it on ruCaptcha service (not free) or just send it to you for solving

	rl.question(`Enter captcha for ${captcha_img} `, (key) => {
		
		//When got a key (message from stdin)
		//Try solve it with resolve method
		solve(key).then(() => {
		
			//If solved correctly
			vk.captcha_stop = false

			console.log('Captcha solved correctly!')

		}).catch(({err, reCall: tryNewCall}) => {

			//Or if not
			console.log('Captcha not solved correctly!!!\nRetrying')
			tryNewCall()

		})

	});
}

easyVK({
	api_v: '5.73',
	// save_session: false,
	session_file: currentSessionFile,

	username: '{LOGIN_HERE}',
	password: '{PASSWORD_HERE}',
	reauth: true,
	captchaHandler: captchaHandler

}).then((vk) => {

	const me = 356607530
	const interval = 700 //IT'S DDOS! Catch some Captcha! 
	//(It's a joke of course, it's not DDOS, but many requests per minute call a captcha error :)

	let i = 0;

	setInterval(() => {
		
		//If no captcha yet, send messages!
		if (!vk.captcha_stop) {
			
			i++;

			console.log(`Sending message [${i}]`)
			return vk.call('messages.send', {
				user_id: me,
				message: 'Very \'Sample\', very \'text\'!'
			})

		}

	}, interval)

}).catch(console.error)


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
