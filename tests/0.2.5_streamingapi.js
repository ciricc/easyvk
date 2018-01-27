var VK = require('../index');


function errHandler (err) {
	console.log(err);
}

VK.login("username", "password").then(function(session){

	
	// New feature: Support Streaming API!!
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
			'tt5': 'почему'
		}).then(function(log){
			console.log(log);
		});

		//If you want get all posts from stream
		
		connection.on('post', function (event) {
			console.log(event);
		});

		//Close connection
		// connection.close();

	}, errHandler);

	//Thank you for use this lib. You can help me fix bugs and search them: github.com/ciricc/easyvk

}, errHandler);
