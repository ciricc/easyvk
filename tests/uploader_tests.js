/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)

const currentSessionFile = path.join(__dirname, '.vksession')

const me = 356607530
const my_group = 162208999
const filePath = __dirname + '/../src/logo_200.png' //change to your file


easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	reauth: true,

	//For this test we need to authenticate like a user (we need a user token)
	username: '{LOGIN_HERE}',
	password: '{PASSWORD_HERE}'
}).then(async (vk) => {


	/*
	 * 
	 * This test runs all the methods from the method list and gets all the upload_url's
	 * So, if it works normally you will see a log like this: '1 / 12 ... 3 / 12 .... 12 / 12, true'
	 * Where true means that response is equal to url (ooooh...)
	 * And you will see ONE ERROR (BECAUSE MY UPLOADER AND GETURL METHOD USE .call() METHOD
	 * FOR GETTING URL, SO ONE OF THE REQUESTS WILL WORK NORMALLY (It will send a message to you or me)
	 * AND THEN AN ERROR WILL OCCUR LIKE `upload_url is not defined in response`)
	 * 
	 * For it to work you need to create your own group or just delete the method where 
	 * the `group_id` var is present
	 *
	 * 
	 */

	async function getMyAlbumId () {
		return vk.call('photos.getAlbums', {
			owner_id: vk.session.group_id || vk.session.user_id
		})
	}



	const Uploader = vk.uploader	
	const album_id = ( await getMyAlbumId() ).vkr.response.items[0].id
	
	//Will log all the urls (12)
	const methods = {
		'photos.getUploadServer' : {
			album_id: album_id
		},
		'photos.getWallUploadServer': {
			album_id: album_id
		},
		'photos.getOwnerPhotoUploadServer': {
			album_id: album_id
		},
		'photos.getMessagesUploadServer': {},
		'photos.getChatUploadServer': {
			chat_id: 1
		},

		//You need to enable the marketplace in your group
		//or else it won't work
		'photos.getMarketUploadServer': {
			group_id: my_group //You need to put your group_id here or else it will throw Access denied
		},
		'photos.getMarketAlbumUploadServer': {
			album_id: album_id,
			group_id: my_group
		},
		'audio.getUploadServer': {},
		'video.save': {},
		'docs.getUploadServer': {},
		'docs.getWallUploadServer': {},
		'photos.getOwnerCoverPhotoUploadServer': {
			group_id: my_group //You need to put your group_id here or else it will throw Access denied
		}
	}

	let i = 0;



	//An error will occur like `upload_url` not defined

	vk.uploader.getUploadURL('messages.send', {
		message: 'Error, but it will be sent, because this method uses .call() method to get URL !',
		user_id: me
	})


	/*
	 *
	 * This code is getting all the upload urls and testing my method - getUploadURL
	 *
	 */

	for (let method in methods) {

		const params = methods[method]
		const { url } = await (Uploader.getUploadURL(method, params))
		
		if (url.length > 0) {
			i++
			console.log(`${i} / 12`)
	 	}

	}

	//true is `Return all response from vk`
	return vk.uploader.getUploadURL(
		'photos.getMessagesUploadServer', {}, true
	)

}).then(async ({ vk, url, vkr }) => {
	
	const Uploader = vk.uploader
	const field = 'photo'


	console.log(vkr === url) //true, because you want get ALL REQUEST DATA

	
	url = url.response.upload_url
	

	//Get response from the file upload to save it for later usage
	let { vkr: fileData } = await ( Uploader.uploadFile(url, filePath, field, {}) )
		fileData = await ( vk.call('photos.saveMessagesPhoto', fileData) )	
		fileData = fileData.vkr.response[0]


	//Create attachments
	const attahcments = [
		`photo${fileData.owner_id}_${fileData.id}_${fileData.access_key}`
	]

	/*
	 *
	 * Sending a message with file
	 * 
	 */

	return vk.call('messages.send', {
		user_id: me,
		attachment: attahcments,
		message: 'Beep boop! I am a file!'
	})


}).then(({vkr, vk}) => {
	
	console.log(vkr)

}).catch(console.error)


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
