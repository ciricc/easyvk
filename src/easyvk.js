"use strict";

const request = require("request");
const encoding = require("encoding");
const fs = require("fs");
const http = require("http");
const staticMethods = require("./utils/staticMethods.js");
const easyVKUploader = require("./utils/uploader.js");
const easyVKLongPoll = require("./utils/longpoll.js");
const easyVKCallbackAPI = require("./utils/callbackapi.js");
const easyVKStreamingAPI = require("./utils/streamingapi.js");
const easyVKWidgets = require("./utils/widgets.js");
const configuration = require("./utils/configuration.js");
const easyVKHelpers = require("./utils/helpers.js");

module.exports = createSession;
module.exports.static = staticMethods;
module.exports.version = "0.4";



async function createSession (params = {}) {
	return new Promise((resolve, reject) => {
		
		if (params.save_session !== false) params.save_session = configuration.save_session;
		
		if (params.session_file) {
			if (!staticMethods.isString(params.session_file)) reject(new Error("The session_file must be a string"));
		} else params.session_file = configuration.session_file;

		if (params.api_v && params.api_v !== configuration.api_v) {
			if (isNaN(params.api_v.toString())) reject(new Error("The api_v parameter must be numeric"));
		} else params.api_v = configuration.api_v;

		if (params.captcha_key && !params.captcha_sid) reject(new Error("You puted captcha_key but not using captcha_sid parameter"));
		else if (!params.captcha_key && params.captcha_sid) reject(new Error("You puted captcha_sid but not puted captcha_key parameter"));
		else if (params.captcha_key && params.captcha_sid) {
			if (isNaN(params.captcha_sid.toString())) reject(new Error("The captcha_sid must be numeric"));
		}

		if (params.reauth !== true) params.reauth = configuration.reauth;
		
		if (params.reauth) {
			if (!(params.password && params.username) && !params.access_token) reject(new Error("You want reauth, but you don't puted username and pass or only access_token"));
			if (params.access_token && params.username) reject(new Error("Select only one way auth: access_token XOR username"));
			if (params.access_token) {
				if (!staticMethods.isString(params.access_token)) reject(new Error("The access_token must be a string"));
			}

			if (params.username && !params.password) reject(new Error("Put password if you want aut with username"));
			if (params.username && params.password) {
				params.username = params.username.toString();
				params.password = params.password.toString();
			}
		}

		let vk = new EasyVK(params, resolve, reject);
	});
}

class EasyVK {
	constructor (params, resolve, reject) {
		
		let session = {};
		let self = this;

		self.params = params;


		if (!params.reauth) {
			let data = fs.readFileSync(params.session_file);
			if (data) {
				
				try {
					data = JSON.parse(data);

					if (data.access_token) {
						session = data;
						initToken();
					} else {
						if (!(params.username && params.password) && !params.access_token) reject(new Error("Session file is empty, please, put a login data"));
					}

				} catch (e) {
					if (!(params.username && params.password) && !params.access_token) reject(new Error("JSON from session file is not valid, please, put a login data"));
				}

			} else {
				if (!(params.username && params.password) && !params.access_token) reject(new Error("Session file is empty, please, put a login data"));
			}
		}

		if (!session.access_token) { //If session file contents access_token, try auth with it
			if (params.access_token) {
				session.access_token = params.access_token;
				initToken();
			} else if (params.username) {
				//Try get access_token with auth
				let getData = {
					username: params.username,
					password: params.password,
					client_id: configuration.WINDOWS_CLIENT_ID,
					client_secret: configuration.WINDOWS_CLIENT_SECRET,
					grant_type: "password",
					v: params.api_v
				};

				if (params.captcha_key) {
					getData.captcha_sid = params.captcha_sid;
					getData.captcha_key = params.captcha_key;
				}


				if (params.code && params.code.toString().length != 0) {
					getData["2fa_supported"] = 1;
					getData["code"] = params.code;
				}

				getData = staticMethods.urlencode(getData);

				request.get(configuration.BASE_OAUTH_URL + "token/?" + getData, (err, res) => {
					
					if (err) {
						reject(new Error(`Server was down or we don't know what happaned [responseCode ${res.statusCode}]`));
					}

					let vkr = res.body;

					if (vkr) {
						let json = staticMethods.checkJSONErrors(vkr, reject);						
						
						if (json) {
							self.session = json;
							
							if (params.save_session) self.saveSession();

							initResolve(self);
						}

					} else {
						reject(new Error(`VK responsed us with empty string! ${vkr}`));
					}

				});

			}
		}

		function initToken() {
			if (!session.user_id && !session.group_id) {
				let token = session.access_token || params.access_token;

				let getData = {
					access_token: token,
					v: params.api_v
				};

				getData = staticMethods.urlencode(getData);

				request.get(configuration.BASE_CALL_URL + "users.get?" + getData, (err, res) => {
					if (err) reject(new Error(err));
					let vkr = res.body;
					if (vkr) {
						let json = staticMethods.checkJSONErrors(vkr, reject);

						if (json) {
							if (Array.isArray(json.response) && json.response.length === 0) {
								groupToken();
							} else {
								session.user_id = json.response[0].id;
								session.first_name = json.response[0].first_name;
								session.last_name = json.response[0].last_name;
								self.session = session;
								self.saveSession();
								initResolve(self);
							}
						}

					} else {
						reject(new Error(`VK responsed us with empty string (in auth with token (user) ) ${vkr}`));
					}
				});

			} else {
				self.session = session;
				initResolve(self);
			}
		}

		function groupToken () {
			let getData = {
				access_token: params.access_token,
				v: params.api_v
			};
			
			getData = staticMethods.urlencode(getData);

			request.get(configuration.BASE_CALL_URL + "groups.getById?" + getData, (err, res) => {
				if (err) reject(new Error(err));
				let vkr = res.body;
				if (vkr) {
					let json = staticMethods.checkJSONErrors(vkr, reject);

					if (json) {
						if (Array.isArray(json.response) && json.response.length === 0) {
							reject(new Error("access_token not valid!"));
						} else {
							session.group_id = json.response[0].id,
							session.group_name = json.response[0].name;
							session.group_screen =  json.response[0].screen_name;
							self.session = session;
							self.saveSession();
							initResolve(self);
						}
					}

				} else {
					reject(new Error(`VK responsed us with empty string (in auth with token (group) ) ${vkr}`));
				}	
			});
		}

		function initResolve (s) {
		
			if (params.clean_session_file) {
				fs.writeFileSync(params.session_file, "{}");
			}

			self.uploader = new easyVKUploader(self);
			self.longpoll = new easyVKLongPoll(self);
			self.config = configuration;
			self.callbackAPI = new easyVKCallbackAPI(self);
			self.streamingAPI = new easyVKStreamingAPI(self);
			self.widgets = new easyVKWidgets(self);
			self.helpers = new easyVKHelpers(self);

			resolve(s);
		}
	}

	/**
	 *	
	 *	Function for calling to methods and get anything
	 *	Docs: vk.com/dev/methods
     *
	 *	@param {String} method_name is just a method name :D (messages.get/wall.edit and others)
	 *	@param {Object} data  if vk.com asks a parameters, you can send they. (Send access_token to this from session is not necessary, but also you can do this)
	 *	
	 *	@return {Promise}
     *
	 */

	async call(methodName, data = {}) {
		var self = this;

		return new Promise((resolve, reject) => {
			
			if (!staticMethods.isObject(data)) reject(new Error("Data must be an object"));

			if (!data.access_token) data.access_token = self.session.access_token;
			if (!data.v) data.v = self.params.api_v;
			if (!data.captcha_sid) data.captcha_sid = self.params.captcha_sid;
			if (!data.captcha_key) data.captcha_key = self.params.captcha_key;

			staticMethods.call(methodName, data, configuration).then(resolve, reject);
		});
	}

	saveSession () {
		let self = this;
		let s = JSON.stringify(self.session);
		fs.writeFileSync(self.params.session_file, s);
	}
}