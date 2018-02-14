var VK = require('../index');


function errorHandler (err) {
	console.log(err);
}


/*
	
	This is test for bot realeased on callback api

*/

VK.login({
	access_token: '68837af8....'
}).then(function(session){
	
	VK.callbackAPI({
		
		groups: [
			{
				group_id: '160315928',
				confirmCode: 'olo6781d',
				secret: 'my_secret_key_no_one_see_this'
			},
		],
		port: (process.env.PORT || 5000)

	}).then(function(connection){
		
		connection.on('message_new', function(event){
			var msg = event.object;

			VK.call('messages.send', {
				peer_id: msg.user_id,
				message: 'Это автоответчик бота! Не обращайте внимание.'
			}).then(function() {

			}, errorHandler);
		});

	}, function (err) {
		console.log('[ERR]', err);
	});

}, errorHandler);