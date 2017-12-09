var VK = require('../index');

//Example for auth, get messages and auth-answer they
//You can put yours data

var username = "email";
var password = "password";
var captcha_sid = "555873104614";
var captcha_key = "hzces7u";

VK.login(username, password, captcha_sid, captcha_key, true).then(function(session){
	
	VK.longpoll().then(function(connection){
		connection.on('message', function(message){
			if (!message.out && !message.chat_id) {
				VK.call('messages.send', {
					user_id: message.uid,
					message: "Это просто автоответчик. Я сейчас занят.",
					attachment: ["photo356607530_456243034"]
				}).then(function(){}, function(err){
					console.log(err);
				});
			}
		});
	});

}, function(err){
	console.log(err);
});
