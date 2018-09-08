/*
 *  Don't forget to require easyvk in your code: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


const currentSessionFile = path.join(__dirname, '.vksession')

/*
 *
 * This test is going thru all my Http widgets
 *
 */


easyVK({
	username: '{LOGIN_HERE}',
	password: '{PASSWORD_HERE}',
	api_v: '5.73',
	save_session: false,
	session_file: currentSessionFile,
	reauth: true,
}).then(vk => {

	const HttpVK = vk.http;


	// First: You need to authenticate by an HTTP form, 
	// with login and password
	return HttpVK.loginByForm().then(({vk: EasyVK, client: Client}) => {

		//Only after this you can read/watch stories from feed and from user_account

		const user_id = 1; //read all Pavel's stories
		
		Client.readStories(user_id).then(({count, vk: EasyVK}) => {
			//Count of already read stories
			console.log(count + ` [;user_id = ${user_id}, stories count]`);

		});

		Client.readFeedStories().then(({count}) => {
			console.log(count + ' [feed stories]');
		});

		//This script shows you how to get all user's audios
		//offset - is offset :D

		function getAllAudios () {
			let audios = [];

			function newReq (offset = 0) {
				return new Promise((resolve, reject) => {
					Client.getAudios({
						vk_id: vk.session.user_id,
						offset: offset,
						playlist_id: -1
					}).then(({audios: audios_, vkr: json}) => {
						audios = [...audios, ...audios_];
						
						if (json.hasMore) {
							newReq(json.nextOffset).then(resolve, reject);
						} else {
							resolve(audios);
						}

					});
				})
			}

			return newReq;
		}

		(getAllAudios())().then((audios_) => {
			//After all completed calls
			console.log(audios_.length);
		});
		

	});

});
