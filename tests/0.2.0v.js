var VK = require('../index');


function errHandler (err) {
	console.log(err);
}

VK.login({
	username: "username",
	password: "password",
	reauth: true,
}).then(function(session){

	
	// New feature: Support Streaming API!!
	VK.streamingAPI({
		client_id: '222222',
		client_secret: 'wzkLEmKOlDflwaaWwdWM' //Example
	}).then(function(connection){
		
		//If you want get all posts from stream
		connection.on('post', function (event) {
			console.log(event);
		});

		//Listen all types of events
		connection.on('pullEvent', function (event) {
			console.log(event.event_type);
		});

		connection.on('failure', function(err){
			console.log('Connection failed!');
		});

		connection.on('error', function(err){
			console.log(err);
		});

		//Manage rules
		connection.initRules({
			'cat_tag': 'кошка',
			'dog_tag': 'собака'
		}).then(function(changeLog){
			console.log(changeLog);
		});

		//It's clear
		connection.addRule('кошка', 'cat_tag').then(function(success){
			console.log(success);
		}, errHandler);

		connection.deleteRule('cat_tag').then(/*....*/);
		connection.deleteAllRules().then(/*....*/);

	}, errHandler);

	//New feature: watch live stream (video) viewers count!
	
	setInterval(function(){
		//You can use this method without login!
		VK.getLiveViews('-16487904_456239423').then(function(views){
			console.log(views);
		}, errHandler);
	}, 3000);


	//And some function which can help you make routine work

	var in_friends_user_id = 356607530;
	var check_id = 279411716;

	VK.isFriend(in_friends_user_id, check_id).then(function(isfriend){
		console.log(isfriend);
	}, errHandler);

	var user_id = 356607530;
	VK.getAllFriendsList(user_id).then(function(friends){
		console.log(friends.length);
	}, errHandler);


	var follower_id = check_id;
	VK.userFollowed(user_id, follower_id).then(function(isfollower){
		console.log(isfollower);
	}, errHandler);


	// //And other:

	console.log(VK.encodeHtml('I am user &amp; my favorite sign is &lt; and sometimes is &quot;')); //Return I am user & my favorite sign is < and sometimes is "


	//Thank you for use this lib. You can help me fix bugs and search them: github.com/ciricc/easyvk

}, errHandler);
