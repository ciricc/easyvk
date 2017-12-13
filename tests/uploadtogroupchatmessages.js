var VK = require('../index');

/*
	
	This test loads your photo (one) to vk.com and then send for me in messages
	Only for dev version!!
	
*/

var access_token = "ec3ed175..."; //Group access_token 
var reauth = true;

VK.login({
	access_token: access_token,
	reauth: reauth
}).then(function(session){

	VK.longpoll().then(function(connection){
		connection.on('message', function(msg){
			if (!msg.out) {
				var peer_id = msg.uid;
				VK.uploadPhotoMessages('./images/left.jpg', peer_id).then(function(photo){
					VK.call('messages.send', {
						peer_id: peer_id,
						attachment: ["photo"+photo.owner_id+"_"+photos.id]
					}).then(function(rvk){
						console.log(rvk);
					}, function(error){
						console.log(error);
					});
				});
			}
		});
	});

}, function(error){
	console.log(error);
});