var VK = require('../index');

//Example for auth, get messages and auth-answer they

var username = "username"; //Phone or email (+7,+8 etc..)
var password = "password";
var captcha_sid = "555873104614";
var captcha_key = "hzces7u";
var reauth = false; //If you are authorized for the first time then my script create session file and in next time you will auth by him

VK.login(username, password, captcha_sid, captcha_key, reauth).then(function(session){
	VK.longpoll().then(function(connection){
		
		connection.on('message', function(message){
			if (!message.out && !message.chat_id) { //If is not my message and it is not a group chat (chat)
				VK.call('messages.send', {
					user_id: message.uid,
					message: "Это просто автоответчик. Я сейчас занят.",
					attachment: ["photo356607530_456243034"]
				}).then(function(){}, function(err){
					console.log(err);
				});
			}
		});

	}, function(error){
		console.log(error);
	});

}, function(err){
	console.log(err);
});