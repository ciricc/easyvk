var easyVK = require('../index');


easyVK({
	api_v: false,
	reauth: true
}).then((vk) => {
	vk.call();
}, (error) => {
	console.log(error);
});