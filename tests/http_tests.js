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


;(async ()=> {

	let VKontakte = await (easyVK({
		api_v: '5.73',
		save_session: true,
		session_file: currentSessionFile,
		username: '{ВАШ_ЛОГИН}',
		password: '{ВАШ_ПАРОЛЬ}',
		platform: ['ios', 'android', 'windows'][0],
	}))

	let { client: Client } = await (VKontakte.http.loginByForm());

	const AudioAPI = Client.audio;


	AudioAPI.reorder({
		owner_id: 356607530,
		audio_id: 456239545,
		after_audio_id: 456239481
	});

	let {vkr: myAudios} = await (AudioAPI.get());
	AudioAPI.edit(myAudios[0], {
		title: 'New title'
		performer: 'Bare Jams',
		text: 'Bare Jams Text Body',
		privacy: 0, //выводить при поиске
		genre: AudioAPI.genres[1001], //ID жанра,этот, например, Jazz & Blues
		autocover: 1 //Добавлять на основе информации облоку автоматически
	});



	// let {vkr: lyricsFromFirstAdio} = await (AudioAPI.getLyrics(myAudios[0]));
	
	// let {vkr: countOfMyAudios} = await (AudioAPI.getCount());

	// let {vkr: foundAudios} = await (AudioAPI.search({
	// 	q: 'Maroon 5'
	// }));

	// //add new audio
	// await (AudioAPI.add(foundAudios[0]));

	// let {vkr: uploadUrl} = await (AudioAPI.getUploadServer());
	// let {vkr: uploadedAuioObject} = await (AudioAPI.upload(
	// 	uploadUrl.upload_url, //url for server
	// 	__dirname + '/main.mp3' //file path
	// ));

	// //you can not save audio, just upload
	// let {vkr: newAudio} = await (AudioAPI.save(uploadedAuioObject));

	// let urlStringExample = 'https://pp.vk.com/main.mp3?extra=HWDHWD...';
	// let {vkr: url} = await (AudioAPI.getURL(urlStringExample));

	// //delete audio
	// AudioAPI.delete(myAudios[0]).then(async () => {
	// 	//restore audio
	// 	await (AudioAPI.restore(myAudios[0]));
	// });

	// //edit audios
	// AudioAPI.edit(myAudios[1], {
	// 	title: 'New Title Of Audio',
	// 	performer: 'New performer',
	// 	text: 'New text for audio'
	// });

	// let {vkr: audiosGotById} = await (AudioAPI.getById({
	// 	ids: [
	// 		'47809103_456239660_96a005aadfc6090c04',
	// 		'47809103_456239659_0e83175853cacdb318',
	// 		'47809103_456239658_5bebe3aa60e930e08a'
	// 	].join(',')
	// }));

})();