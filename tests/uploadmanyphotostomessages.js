var VK = require('../index');

/*
	
	This test loads your photos (many) to vk.com and then send for me in messages
	Only for dev version!!
	
*/

var password = "password";
var username = "username";
var reauth = false;
var user_id = 356607530;


VK.login({
	username: username,
	password: password,
	reauth: reauth
}).then(function(session){
	
	VK.uploadPhotosMessages(['./images/left.jpg', './images/home.jpg']).then(function(photos){
		var attachment = [];
		for (var i = 0; i < photos.length; i++) {
			attachment.push(photos[i].id);
		}

		VK.call('messages.send', {
			user_id: user_id,
			attachment: attachment
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

