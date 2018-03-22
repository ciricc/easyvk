const easyVK = require('../index.js')


const currentSessionFile = `${__dirname}/.vksession`

const counters = {
	shares: 0,
	posts: 0,
	comments: 0,
}


easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	//Access token whcch you need get from your group settings
	access_token: '{TOKEN_FIELD}',
}).then((vk) => {

	const myApplicationId = '{APPLICATION_ID_FIELD}'
	const myApplicationSecret = '{APPLICATION_SECRET_FIELD}'

	const StreamingAPI = vk.streamingAPI


	return StreamingAPI.connect({
		clientId: myApplicationId,
		clientSecret: myApplicationSecret
	})

}).then(({ connection, vk }) => {

	//Statistic counters
	//When some event was declared need inrement counters
	connection.on('post', () => (counters.posts += 1))
	connection.on('share', () => (counters.shares += 1))
	connection.on('comment', () => (counters.comments += 1))
 

    //All errors listeners
	connection.on('error', console.error)
	connection.on('failure', console.error)

	//Not errors, but it an make some error
	connection.on('serviceMessage', console.log)

    
    /*
     *
     * This method initializing your rules and manages them
     * For example: if you deleted from this obj some keyRule, it will be deleted from stream settings 
     *
     */

	const initRules = connection.initRules({
		key1: 'коти', //Cats
		key2: 'кот', //Cat
		key3: 'а со -собака', //Dog
	}, ({where, rule, error}) => {

		console.error(`Occured error on ${where} method in ${rule} rule (${error})`)

	})

	return new Promise(async (resolve, rejects) => { 

		//send connection to next chain
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
     * This function sends statistic with EasyVK object by call to messages.send method
     * If you want to send statistic to you, you need change `me` variable on your user_id
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

    //Every `interval` milliseconds
	const intervalId = setInterval(() => {
		
		const now = new Date()



		sendStatistics()
		
		console.log('Sended success!')

		if (now - start >= interval * countOfSends) {
			
			console.log('Closing connection....')

			closeConnection()
			clearInterval(intervalId)
		}

	}, interval)
 	




}).catch(console.error)


//Handle all rejects and errors
process.on('unhandledRejection', console.error)