var VK = require('../index');

var password = "password";
var username = "username";
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