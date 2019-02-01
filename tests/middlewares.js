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
	access_token: "{USER_TOKEN}",
	reauth: true
}).then(vk => {

	vk.use(async ({next, thread}) => {

		let version = thread.query.v;

		if (Number(version) >= 5.90 && !thread.query.random_id) {
			thread.query.random_id = new Date().getTime() + '' + Math.floor(Math.random() * 1000);
		}

		await next();
	})


	vk.use(async ({next, thread}) => {
		console.log(thread, 'I CAN CHANGE THIS!!');
		await next();
	})	


	vk.call("messages.send", {
		peer_id: vk.session.user_id,
		message: 'Hello!',
		v: '5.90'
	});

	vk.longpoll.connect().then(({connection}) => {
		
		// Simple longpoll connection plugin for new updates
		connection.use(async ({next, thread}) => {
			
			thread.updates.forEach((upd, i) => {
				if (upd.type == 4) {
					upd.object = {
						id: upd.object[1],
						body: upd.object[5]
					}
				}
			})

			await next();
		});

		connection.use(async ({next, thread}) => {
			console.log(thread.updates, 'i am on second');
		});

		connection.on("message", console.log)

		console.log(connection);

	});
	

}).catch(e => {
	
	console.log(e);

});

process.on("unhandledRejection", console.log)