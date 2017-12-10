var VK = require('../index');

//Example for auth, get messages and auth-answer they

var username = "username"; //Phone or email (+7,+8 etc..)
var password = "password";
var captcha_sid = "555873104614";
var captcha_key = "hzces7u";
var reauth = true; //If you are authorized for the first time then my script create session file and in next time you will auth by him

VK.login(username, password, captcha_sid, captcha_key, reauth).then(function(session){
	VK.longpoll().then(function(connection){
		
		//Rewrite my listener
		connection.addEventType(4, 'mymessages', function(rvk){
			
			/*
				Here we create a new event. 
				It listens to the server and receives information from it in its pure form. 
				Next, you must call it using the emit method
			*/
			this.emit('mymessages', rvk); 
		}, true);


		//Listen your event
		connection.on('mymessages', function(data){
			console.log(data);
		});

		//it not will be work after those actions :( 
		connection.on('message', function(data){
			console.log(data);
		});

	}, function(error){
		console.log(error);
	});

}, function(err){
	console.log(err);
});