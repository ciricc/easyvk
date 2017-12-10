var VK  = require('../index');

var access_token = "your_access_token";
var user_id = 356607530;
var message = "Hi, Kirill! I am use your lib!";

VK.login({
	access_token: access_token,
	reauth: false
}).then(function(session){
	
	VK.call('messages.send', {
		user_id: user_id,
		message: message
	}).then(function(rvk){
		console.log(rvk)
	}, function(error){
		console.log(error); //If access_toen no have permsissions or you got a captcha error, you need log this.
	});

}, function(error){
	console.log(error);
});