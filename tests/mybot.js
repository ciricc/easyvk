var VK  = require('../index');
const { exec } = require('child_process');


//My group token

/*

	This code create your mini-bot like bot maksim: vk.com/bot_maksim
	My live example: vk.com/sayme_bot
	
	P.S: Only for windows (sorry)
	For test it you need download balcon program (балаболка) and add to it new language and voice - https://goo.gl/62F9wS (install it too)
	
*/


var access_token = "6ef603d...";

var errorHandler = function(error) {
	console.log(error);
}


VK.login({
	access_token: access_token
}).then(function(session){

	VK.longpoll().then(function(connection){
		
		connection.on('message', function(msg){
			if (!msg.out) {
				var peer_id = msg.user_id;
				var body = msg.body;
				body = body.toLowerCase().replace(/\./g, ",");
				var name = "my_"+peer_id+"_"+msg.id+".wav";
				
				VK.call('messages.markAsRead', {
					peer_id: peer_id,
					start_message_id: msg.id
				});

				VK.call('messages.setActivity', {
					peer_id: peer_id,
					type: "typing"
				});

				exec('balcon.exe -w '+name+' -t "'+body+'" -n "IVONA 2 Maxim OEM"', {
					cwd: 'balcon'
				}, function(err, stdout, stderr){
					VK.uploadDoc('./balcon/'+name, peer_id, "audio_message").then(function(doc){
						var voice_msg = "doc"+doc.owner_id+"_"+doc.id;
						VK.call('messages.send', {
							peer_id: peer_id,
							attachment: [voice_msg]
						}).then(function(vkr){
						}, errorHandler);
					}, errorHandler);
				});
			}
		
		});

	}, errorHandler);

}, errorHandler);