var VK = require('../index');

VK.login("username", "password").then(function(session){
	var type = "audio_message";
	var user_id = 356607530;

	VK.uploadDoc("./my_voice.wav", user_id, type).then(function(voice_doc){
		
		VK.call('messages.send', {
			user_id: user_id,
			attachment: ["doc"+voice_doc.owner_id+"_"+voice_doc.id]
		}).then(function(vkr){
			console.log(vkr);
		}, function(error){
			console.log(error);
		});

	}, function(error){
		console.log(error);
	});

}, function(error){
	console.log(error);
});
