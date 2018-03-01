let easyVK = require('../index');
let fs = require("fs");
let request = require("request");


errHandler = (err) => {
	console.log(err);
}

easyVK({
	reauth: true,
	clean_session_file: true,
	access_token: "your_token"
}).then((vk) => {

	vk.callbackAPI.listen({
		groups: [
			{
				groupId: "11",
				confirmCode: "112",
				secret: "wdwd"
			}
		],
		confirmCode: "12322",
		groupId: "wdwd",
		port: "8080"
	}).then((http) => {
		
		console.log(http.server, http.app);

	}, errHandler);

	vk.uploader.uploadAvatar(file_name, {
		forGetURL: {
			owner_id: "-161172632"
		},
		forUpload: {
			_square_crop: "20,20,120"
		}
	}).then((vkr) => {}, errHandler);
	
}, errHandler);