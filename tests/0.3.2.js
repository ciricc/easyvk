var easyVK = require('../index');


easyVK({
	api_v: false,
	access_token: `wdw`,
	reauth: true
}).then((vk) => {

}, (error) => {
	console.log(error);
});