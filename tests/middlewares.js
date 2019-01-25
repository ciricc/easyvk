/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const evk = require(`${_easyvk}`)



const currentSessionFile = path.join(__dirname, '.vksession')

/**
 *
 *  This test run your own bot for group
 *  For run it you need enable LongPoll in your group and then get access_token
 *  After this, put your access_token in {acess_token} parameter
 *  And then run it. Send messgeto your bot, he will reply on it!
 *
 */

evk({
	session_file: currentSessionFile,
	access_token: "{GROUP_TOKEN}",
	reauth: true
}).then(vk => {

	async function myMiddleWare ({ next, other, data}) {
		data.query.passprt = 1;

		await next();
	}

	async function myMiddleWare2 ({ next, other, data}) {
		data.query.passprt2 = 1;
		data.method = "callbe";
		await next();
	}

	async function myMiddleWare3 ({ next, other, data}) {
		data.method = "execute";
		await next();
	}


	vk.callbackAPI.listen({
		port: 3000,
		groups: [],
		path: "/webhook"
	}).then(({connection}) => {
		connection.on("message_new", (msg) => {
			console.log(msg);
		})
	});

	vk.bots.longpoll.connect().then(({connection}) => {
		connection.on("message_new", console.log);
	})


	vk.use(myMiddleWare);
	vk.use(myMiddleWare2, (e) => {console.log(e)});
	
	vk.use(myMiddleWare3);

	
	vk.call("execute", {});

}).catch(e => {
	
	console.log(e);

});

process.on("unhandledRejection", console.log)