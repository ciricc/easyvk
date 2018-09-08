const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const currentSessionFile = path.join(__dirname, '.vksession')



easyVK({
	username: '{LOGIN_HERE}',
	password: '{PASSWORD_HERE}',
	session_file: currentSessionFile,
	save_session: true,
	reauth: true
}).then((vk) => {
	

	console.log(vk.session)


	//This will be deleted when a new session starts, but you can changed data like so
	vk.session.changes = [1,2,3,4]

	vk.session.save()
	.then(() => vk.session.clear()) //clear all data
	.then(() => vk.session.setPath(path.join(__dirname, '.vksession2changed')))
	.then(() => {

		//Changing data (you can do it too)
		vk.session.tokenChanged = []

		return vk.session.save() //Saving only these changes
	})
	.then(() => console.log(JSON.stringify(vk.session))) //Object with tokenChanged array


	//Testing a deprecated method
	try {
		vk.saveSession();
	} catch (err) {
		console.log(err)
	}

}).catch(console.error)


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
