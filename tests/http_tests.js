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
		username: '{USERNAME}',
		password: '{PASSWORD}',
		platform: ['ios', 'android', 'windows'][0],
	}))

	let { client: Client } = await (VKontakte.http.loginByForm());

	const AudioAPI = Client.audio;


	AudioAPI.getPlaylists().then(({vkr}) => {
		let playlists = vkr;
		let i = 0;
		
		function deleteP () {
			if (i < playlists.length) {
				if (playlists[i].followed) {
					return AudioAPI.followPlaylist(playlists[i]);
				}

				return AudioAPI.deletePlaylist(playlists[i]);
			} else {
				return false;
			}
		}

		let go = () => {	
			let k;
			(k = deleteP()) ? k.then(() => {
				i++;
				setTimeout(go, 400)
			}) : null;
			return k;
		}

		go();
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