let easyVK = require('../index');
let fs = require("fs");
let request = require("request");


errHandler = (err) => {
	console.log(err);
}

//Methos whch no need authentication with access_token
easyVK.static.call("users.get", {
	user_ids: "1"
}).then((vkr) => {
	console.log(vkr.response);
}, errHandler);

easyVK({
	reauth: true,
	clean_session_file: true,
}).then((vk) => {

	//With access_token call
	vk.call("users.get", {
		user_ids: "1"
	}).then((vkr) => {
		console.log(vkr.response);
	}, errHandler);

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

	// vk.uploader.uploadAvatar(file_name, {
	// 	forGetURL: {
	// 		owner_id: "-161172632"
	// 	},
	// 	forUpload: {
	// 		_square_crop: "20,20,120"
	// 	}
	// }).then((vkr) => {}, errHandler);

}, errHandler);