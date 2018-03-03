const easyVK = require("../index.js");



easyVK({
	access_token: "your_token"
	reauth: true,
}).then((vk) => {


	errHandler = (err) => {
		console.log(vk.debugger.lastLog());
	}



	vk.call("wall.post", {
		message: `tooooooo large text...... more than 12000 symbs`
	}, "post").then((vkr) => {
		console.log(vkr);
	}, errHandler);

	// vk.call("users.get", {
	// 	user_ids: "1"
	// }).then((list) => {
	// 	console.log(list.response);
	// }, errHandler);

	// vk.call("execute", {
	// 	code: `return API.wall.get({"user_id": "1"}).items;`
	// }).then((posts) => {
	// 	console.log(posts);
	// }, errHandler);

	// vk.streamingAPI.connect({
	// 	clientId: "1111...",
	// 	clientSecret: "wWmJKLl..."
	// }).then((connection)=>{
		
	// 	connection.initRules({
	// 		"tag": "value",
	// 		"tag2": "+value -value2 \"value3\"",
	// 	}).then(log => {
	// 		console.log(log) //Changed, added, deleted
	// 	}, errHandler);
		
	// 	connection.on("post", (postData) => {
	// 		console.log(postData.event_url);
	// 	});

	// }, errHandler);

	// vk.helpers.isFriend("1").then((isFriend) => {
	// 	console.log(isFriend) //false
	// }, errHandler);

	/*
		
		Read documentation for know more...

	*/

}).catch((err) => {
	console.log(err);
});