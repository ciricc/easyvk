const easyVK = require("../index.js");
const request = require("request");


easyVK.static.call("users.get", {
    user_ids: ["1", "156"]
}).then((vkr) => {
    console.log(vkr.response[0].id); //1
}, (e) => {console.log(e);});

errHandler = (err) => {
	console.log(err);
}

easyVK({
	access_token: "your_token"
}).then((vk) => {
	
	vk.longpoll.connect().then(connection => {
	    connection.on("message", (msg) => {
	        console.log(msg);
	    });
	}).catch(errHandler);

	vk.streamingAPI.connect({
	    clientSecret: "ExMalP1E",
	    clientId: "6333355"
	}).then((stream) => {
	    stream.initRules({
	        "cats": "кот",
	        "dogs": "собака пес щенок"
	    }).then((log) => {
	        stream.getRules().then((rules) => {
	                console.log(rules);
	        }, errHandler);
	    }).catch(errHandler);
	}).catch(errHandler);

}).catch((err) => {
	console.log(err);
});