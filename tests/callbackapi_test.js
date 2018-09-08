
/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


const serverPort = (process.env.PORT || 80)

easyVK.callbackAPI.listen({
	groups: [
		{
			groupId: '{GROUP_ID_EXAMPLE_1}',
			secret: '{YOUR_GROUP_SECRET_PASSWORD}',
			confirmCode: '{YOUR_GROUP_CONFIRMATION_CODE}' 
			//If needed, in next release I will add a groups.getCallbackConfirmationCode method
		},

		// {}, {}, .... , {}, 
	],

	port: serverPort

}).then(({connection, web}) => {

	
	//web.app, web.server - variables for a server, express

	console.log(`Starting a server on 127.0.0.1:${serverPort}`)

	const errorEvents = [
		'secretError',
		'eventEmpty',
		'confirmationError'
	]


	errorEvents.forEach((eventName) => {
		connection.on(eventName, ({postData, description}) => {
			console.error(description)
			console.log(`Errored here [${postData}]`)
		})
	})



	connection.on('message_new', console.log)

	/**
	 *
	 *   If you authenticated by `easyVK()` function, then you can call to VK API methods by `.call()`
	 *   If not, you need to use staticMethods to do this
	 *   
	 *   easyVK.staticMethods.call('messages.send', {
	 *  	access_token: '{YOUR_ACCESS_TOKEN}'
	 *   }).then(() => {
     	 *
	 *   })
	 *
	 */

}).catch(console.error)


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
