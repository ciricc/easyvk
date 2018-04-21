const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const currentSessionFile = path.join(__dirname, '.vksession')



easyVK({
	access_token: '{YOUR_ACCESS_TOKEN}',
	session_file: currentSessionFile,
	save_session: true
}).then((vk) => {
	

	console.log(vk.session)


	//It will be deleted, but you can changed data like so
	vk.session.changes = [1,2,3,4]

	vk.session.save()
	.then(() => vk.session.clear())
	.then(() => vk.session.setPath(path.join(__dirname, '.vksession2canged')))
	.then(() => {

		//Changing data, you can do it too
		vk.session.tokenChanged = []

		return vk.session.save()
	})
	.then(() => console.log(JSON.stringify(vk.session))) //Object with tokenChanged array

}).catch(console.error)


//Handle all rejects and errors
process.on('unhandledRejection', console.error)