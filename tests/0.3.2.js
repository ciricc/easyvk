let easyVK = require('../index');
let fs = require("fs");
let request = require("request");


errHandler = (err) => {
	console.log(err);
}

easyVK({
	// api_v: false,
	// reauth: true,
}).then((vk) => {
	
	vk.longpoll.connect().then((connection) => {
		console.log("Success!");
		
		connection.on("message", (msg) => {
			console.log(msg);
		});

		// console.log(connection);
	}, errHandler);

	// vk.call("stories.getPhotoUploadServer", {
	// 	add_to_news: 1
	// }).then((vkr) => {
	// 	let url = vkr.response.upload_url;
	// 	let file_name = "../src/story.jpg";
	// 	vk.uploader.uploadAvatar(file_name, {
	// 		forGetURL: {
	// 			owner_id: "-161172632"
	// 		},
	// 		forUpload: {
	// 			_square_crop: "20,20,120"
	// 		}
	// 	}).then((vkr) => {
	// 	}, errHandler);
	// }, errHandler);

}, errHandler);