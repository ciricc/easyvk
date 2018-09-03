/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


const currentSessionFile = path.join(__dirname, '.vksession')

const counters = {
	shares: 0,
	posts: 0,
	comments: 0,
}


easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	//Access token that you need to get from your group settings
	access_token: '{TOKEN_HERE}',
}).then((vk) => {

	const myApplicationId = '{MY_APPLICATION_ID_FIELD}'
	const myApplicationSecret = '{MY_APPLICATION_SECRET_KEY_FIELD}'

	const StreamingAPI = vk.streamingAPI


	return StreamingAPI.connect({
		clientId: myApplicationId,
		clientSecret: myApplicationSecret
	})

}).then(({ connection, vk }) => {

	//Statistic counters
	//On event the counter increments
	connection.on('post', () => (counters.posts += 1))
	connection.on('share', () => (counters.shares += 1))
	connection.on('comment', () => (counters.comments += 1))
 

    	//On error - console.error :D
	connection.on('error', console.error)
	connection.on('failure', console.error)

	//Not an error, but I'm logging it anyway :)
	connection.on('serviceMessage', console.log)

    
    /*
     *
     * This method initializes your rules and manages them
     * For example: if you delete a rule (like keyRule) from this obj, it will be deleted from stream settings 
     *
     */

	const initRules = connection.initRules({
		key1: 'коти', //Cats
		key2: 'кот', //Cat
		key3: 'а со -собака', //Dog
	}, ({where, rule, error}) => {

		console.error(`An error occured in ${where} method in rule ${rule}. (${error})`)

	})

	return new Promise(async (resolve, rejects) => { 

		//sending connection to the next chain
		const changes = await initRules
		changes.connection = connection

		resolve(changes)
	})

}).then(({ log: changes, vk, connection }) => {
	
	const interval = 18000
	const me = 356607530
	const countOfSends = 3
	const start = new Date()

	console.log(changes)

    /*
     *
     * This function sends statistics by calling to the messages.send method
     * If you want to send statistics to yourself, change the `me` variable to your user_id
     * 
     */

	async function sendStatistics () {
		
		console.log('Send statistics.... ')

		const templateStatistic = 
		`
			Постов: ${counters.posts}
			Комментариев: ${counters.comments}
			Репостов: ${counters.shares}
		`

		return await vk.call('messages.send', {
			message: templateStatistic,
			user_id: me,
		})
	}


	async function closeConnection () {
		return await connection.close()
	}

	async function deleteRules () {
		return await connection.deleteAllRules()
	}

    //Every `interval` milliseconds
	const intervalId = setInterval(() => {
		
		const now = new Date()



		sendStatistics()
		
		console.log('Sended success!')

		if (now - start >= interval * countOfSends) {
			
			console.log('Closing connection....')

			closeConnection()
			clearInterval(intervalId)
			deleteRules()
		}

	}, interval)
 	




}).catch(console.error)


//Handler for all rejections and errors
process.on('unhandledRejection', console.error)
