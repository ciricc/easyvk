let easyVK = require('../index');
let fs = require("fs");
let request = require("request");

easyVK({
	// api_v: false,
	reauth: true,
}).then((vk) => {
	
	vk.call("stories.getPhotoUploadServer", {
		add_to_news: 1
	}).then((vkr) => {
		let url = vkr.response.upload_url;
		let file_name = "../src/story.jpg";
		vk.uploader.uploadFile(url, file_name, "file");
	}, (err) => {
		console.log(err);
	});

}, (error) => {
	console.log(error);
});