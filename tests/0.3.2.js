var easyVK = require('../index');


easyVK({
	api_v: false,
	reauth: true,
}).then((vk) => {
	vk.call('users.get', {
		user_ids: ['356607530']
	}).then((response) => {
		console.log(response);
	}, (error) => {
		console.log(error);
	});
}, (error) => {
	console.log(error);
});