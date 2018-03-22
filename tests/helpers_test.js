const easyVK = require('../index.js')

const currentSessionFile = `${__dirname}/.vksession`

/*
 *
 *    This test check that user id1 is followed on you (false)
 * 	  Then it check that user id1 is in list of your friends  (false)
 *	  And after all it gets list of Friend user's id1 ([].length === 0) //true
 *
 */

easyVK({
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,

	//Need user authentication
	username: '{LOGIN_FIELD}',
	password: '{PASSWORD_FIELD}',

}).then(async (vk) => {

	const Helpers = vk.helpers

	let {vkr: isFriend } = await (Helpers.isFriend(1))
	let {vkr: isFollower} = await (Helpers.userFollowed(1))
	let {vkr: friendsPavel} = await (Helpers.getAllFriendsList(1))

	console.log(isFriend, isFollower, friendsPavel.length) //false, false, 0


}).catch(console.error)

//Handle all rejects and errors
process.on('unhandledRejection', console.error)