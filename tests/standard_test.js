const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


const currentSessionFile = path.join(__dirname, '.vksession')



easyVK({
	access_token: '{GROUP_TOKEN}',
	save_session: false,
	session_file: currentSessionFile,
	lang: "ru"
}).then(async (vk) => {

	let group = await (vk.call('groups.getById'));

	console.log(group.vkr, 'Is you..');

	let longPollParams = await (vk.call('messages.getLongPollServer', {
		group_id: vk.session.group_id
	}));

	console.log(
		longPollParams.vkr.getFullResponse()
	);

	return  vk.call('messages.send', 
		{
			message: 'Test message!',
			user_id: (vk.session.user_id || 356607530)
		})
	.then(({vkr}) => {
		console.log(vkr);
	})


}).catch(console.error)


//Handle all rejects and errors
process.on('unhandledRejection', console.error)


