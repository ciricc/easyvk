/**
 *  In your code you need require easyvk so: require('easyvk')
 */

const path = require('path')

const _easyvk = path.join(__dirname, 'easyvk.js')

const easyVK = require(`${_easyvk}`)


const currentSessionFile = path.join(__dirname, '.vksession')


/*
 *
 * This test is testing all my Http widgets
 */


easyVK({
	username: '{LOGIN_HERE}',
	password: '{PASSWORD_HERE}',
	api_v: '5.73',
	save_session: true,
	session_file: currentSessionFile,
	// reauth: true,
}).then(vk => {

	const HttpVK = vk.http;


	// First: You need authenticate by HTTP form, 
	// with login and password
	return HttpVK.loginByForm().then(({vk: EasyVK, client: Client}) => {

		//Only after this you can read/watch stories from feed and from user_account

		// const user_id = 1; //read all Pavel's stories
		
		// Client.readStories(user_id).then(({count, vk: EasyVK}) => {
		// 	//Count of stories, that readed
		// 	console.log(count + ` [;user_id = ${user_id}, stories count]`);

		// });

		// Client.readFeedStories().then(({count}) => {
		// 	console.log(count + ' [feed stories]');
		// });

		// Client.audio.get({
		// 	owner_id: -45703770,
		// 	offset: 0,
		// 	playlist_id: -1
		// }).then(({vkr}) => {
		// 	console.log(vkr);
		// });

		// Client.audio.getCount({
		// 	owner_id: -45703770
		// }).then(({vkr}) => {
		// 	console.log(vkr);
		// })

		// Client.audio.getById({
		// 	ids: '47809103_456239660_96a005aadfc6090c04,47809103_456239659_0e83175853cacdb318,47809103_456239658_5bebe3aa60e930e08a,47809103_456239657_ccf60c6ac7a6f701df,47809103_456239656_bf45c6edbd80c695bb,47809103_456239660'
		// }).then(({vkr, json}) => {
			
		// 	console.log(vkr);

		// });


		// Client.audio.getUploadServer().then(({vkr}) => {
		
		// 	let url = vkr.upload_url;

		// 	Client.audio.upload(url, __dirname + '/main.mp3').then(({vkr}) => {
				
		// 		vkr.title = 'Новое название';
		// 		vkr.artist = 'Новый Артист';

		// 		return Client.audio.save(vkr);

		// 	}).then(({vkr}) => {
		// 		console.log(vkr, 'saved audio');
		// 	}).catch(console.error);

		// });

		let { classes: EasyVKClasses } = easyVK;

		let handler = (err) => {

			switch (err.constructor.name) {
				case EasyVKClasses.EasyVKError: 
					break;
				case EasyVKClasses.VKResponseError:
					break;
				case "Error":
					break;
			}

		}
		

		// Client.audio.search({
		// 	q: 'maroon 5',
		// 	offset: 50,
		// }).then(({vkr, json}) => {
			
		// 	Client.audio.add(vkr[0]).then(({vkr}) => {
		// 		console.log(vkr);
		// 	});

		// }, handler);



		Client.audio.get().then(({vkr}) => {
			
			let audio = vkr[1];
			console.log(audio.title);

			Client.audio.getAudioText(audio).then(({vkr}) => {
				console.log(vkr);
			})

		});





		// vk.call('messages.getById', {
		// 	message_ids: 355361
		// }).then(({vkr}) => {
		// 	let attach = vkr.items[0].attachments[0];
		// 	let audio = attach.audio;
		// 	console.log(Client.audio.__UnmuskTokenAudio(audio.url))
		// });




	});

});