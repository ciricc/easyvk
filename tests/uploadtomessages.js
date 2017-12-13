var VK = require('../index');

/*
	
	This test loads your photo (one) to vk.com and then send for me in messages
	Only for dev version!!
	
*/

var username = "username";
var password = "password";
var reauth = false;
var user_id = 356607530;


VK.login({
	username: username,
	password: password,
	reauth: reauth
}).then(function(session){
	
	VK.uploadPhotoMessages('./images/left.jpg').then(function(photo){
		
		VK.call('messages.send', {
			user_id: user_id,
			attachment: [photo.id]
		}).then(function(rvk){
			console.log(rvk);
		}, function(error){
			console.log(error);
		});

	}, function(error){
		console.log(error);
	});

}, function(error){
	console.log(error);
});