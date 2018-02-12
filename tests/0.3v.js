var VK = require('../index');

//Example for auth, get messages and auth-answer they

var username = "username"; //Phone or email (+7,+8 etc..)
var password = "password";
var captcha_sid = "605510655542";
var captcha_key = "h4aqm8s";
var reauth = false; //If you are authorized for the first time then my script create session file and in next time you will auth by him

VK.login(username, password, captcha_sid, captcha_key, reauth).then(function(session){

	VK.longpoll().then(function(connection){

		connection.on('message', function(message){
			if (!message.out && !message.chat_id && message.user_id != session.user_id) { //If is not my message and it is not a group chat (chat)
				console.log(message.attachments);
				VK.call('messages.send', {
					user_id: message.user_id,
					message: "Это просто автоответчик. Я сейчас занят.",
					attachment: ["video85635407_165186811_69dff3de4372ae9b6e"]
				}).then(function(){}, function(err){
					console.log(err);
				});
			}
		});

		connection.on('close', function (event) {
			console.log(event);
		});

		// connection.close();


	}, function(error){
		console.log(error);
	});

	VK.streamingAPI({
		client_id: '222232332',
		client_secret: 'MklOppwhHHwmKloADfJ' //Example
	}).then(function(connection){
		

		connection.initRules({
			'tt': '1',
			'tt__': '2',
			'tt2': '1 2 3',
			'tt3': 'как',
			'tt4': 'интернет',
			'tt5': 'почему',
		}).then(function(log){
			console.log(log);
		});

		//If you want get all posts from stream
		
		connection.on('post', function (event) {
			console.log(event);
		});

		//Close connection
		// connection.close();

	}, function(err){
		console.log(err);
	});


	//It will be first, because async
	//earlier this function interrupts the execution of the next block
	//In 0.3 version all functions is async
	
	console.log(true);

}, function(err){
	console.log(err);
});