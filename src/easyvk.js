const request = require("request");
const encoding = require("encoding");
const fs = require("fs");
const http = require("http");

//Modules
const staticMethods = require("./utils/staticMethods.js");
const easyVKUploader = require("./utils/uploader.js");
const easyVKLongPoll = require("./utils/longpoll.js");
const easyVKCallbackAPI = require("./utils/callbackapi.js");
const easyVKStreamingAPI = require("./utils/streamingapi.js");
const easyVKWidgets = require("./utils/widgets.js");
const configuration = require("./utils/configuration.js");
const easyVKHelpers = require("./utils/helpers.js");
const easyVKRequestsDebugger = require("./utils/debugger.js");
const easyVKBotsLongPoll = require("./utils/botslongpoll.js");


module.exports.version = "1.0";
module.exports.callbackAPI = new easyVKCallbackAPI({});
module.exports.streamingAPI = new easyVKStreamingAPI({});;

/**
 *  EasyVK module. In this module creates session by your params
 *  And then you will get a EasyVK object (Session creates in the easyvkInit.js file)
 *  Author: @ciricc
 *  License: MIT
 *  
 */


class EasyVK {

	//Here will be created session
	constructor (params, resolve, reject) {
		
		let session = {}, 
		self = this;

		self.params = params;
		self.debugger = new easyVKRequestsDebugger(self);

		if (!params.reauth) {
			
			let data = fs.readFileSync(params.session_file);
			
			if (data) {
				
				try {
					data = JSON.parse(data);

					if (data.access_token) {
						session = data;
						initToken();
					} else {
						
						if (!(params.username && params.password) && !params.access_token) {
							return reject(new Error("Session file is empty, please, put a login data"));
						}

					}

				} catch (e) {
					
					if (!(params.username && params.password) && !params.access_token) {
						return reject(new Error("JSON from session file is not valid, please, put a login data"));
					}

				}

			} else {
				
				if (!(params.username && params.password) && !params.access_token) {
					return reject(new Error("Session file is empty, please, put a login data"));
				}

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
					getData.code = params.code;
				}

				getData = staticMethods.urlencode(getData);

				request.get(configuration.BASE_OAUTH_URL + "token/?" + getData, (err, res) => {
					

					if (err) {
						return reject(new Error(`Server was down or we don't know what happaned [responseCode ${res.statusCode}]`));
					}


					let vkr = res.body;
					self.debugger.push("response", vkr);

					if (vkr) {
						let json = staticMethods.checkJSONErrors(vkr, reject);						
						
						if (json) {
							self.session = json;
							
							if (params.save_session) self.saveSession();

							initResolve(self);
						}

					} else {
						return reject(new Error(`VK responsed us with empty string! ${vkr}`));
					}

				});

			}
		}

		function initToken() {
			if (!session.user_id && !session.group_id) {
				
				let token, getData;

				token = session.access_token || params.access_token;

				getData = {
					access_token: token,
					v: params.api_v
				};

				getData = staticMethods.urlencode(getData);

				request.get(configuration.BASE_CALL_URL + "users.get?" + getData, (err, res) => {
					
					if (err) {
						return reject(new Error(err));
					}

					let vkr = res.body;
					self.debugger.push("response", vkr);
					
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
						return reject(new Error(`VK responsed us with empty string (in auth with token (user) ) ${vkr}`));
					}

				});

			} else {
				self.session = session;
				initResolve(self);
			}
		}

		function groupToken () {

			let getData;

			
			getData = staticMethods.urlencode({
				access_token: params.access_token,
				v: params.api_v
			});


			request.get(configuration.BASE_CALL_URL + "groups.getById?" + getData, (err, res) => {
				
				if (err) {
					return reject(new Error(err));
				}

				let vkr = res.body;
				self.debugger.push("response", vkr);
				
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
					return reject(new Error(`VK responsed us with empty string (in auth with token (group) ) ${vkr}`));
				}

			});
		}

		function initResolve (s) {
		
			if (params.clean_session_file) {
				fs.writeFileSync(params.session_file, "{}");
			}

			if (!params.captchaHandler || !Object.prototype.toString.call(params.captchaHandler).match(/Function/)) {
				params.captchaHandler = ({captcha_sid, captcha_key}) => {
					throw new Error(`
						[Captcha error] 
						You need solve it and then put to params captcha_key, or use captchaHandler for solve it automatic 
						(captcha_key=${captcha_key}; captcha_sid =${captcha_sid})
					`);
				}
			}

			
			self.captchaHandler = params.captchaHandler;			
			self.uploader = new easyVKUploader(self);
			self.longpoll = new easyVKLongPoll(self);
			self.config = configuration;
			self.callbackAPI = new easyVKCallbackAPI(self);
			self.streamingAPI = new easyVKStreamingAPI(self);
			self.widgets = new easyVKWidgets(self);
			self.helpers = new easyVKHelpers(self);
			self.bots = {};
			self.bots.longpoll = new easyVKBotsLongPoll(self); 

			return resolve(s);
		}
	}

	/**
	 *	
	 *	Function for calling to methods and get anything form VKontakte API
	 *	See more: https://vk.com/dev/methods
	 *
	 *	@param {String} methodName - Is just a method name which you need to call and get data,
	 *  for example: "messages.send", "users.get"
	 *	@param {Object} [data={}] - Is data object for query params, it will be serialized from object to uri string. 
	 *  If vk.com asks a parameters, you can send they. 
	 *  (Send access_token to this from session is not necessary, but also you can do this)
	 *	@param {String} [methodType=get] - Is type for query, ["post", "delete", "get", "put"]
	 *	
	 *  @return {Promise}
	 *  @promise Call to a method, send request for VKontakte API
	 *  @resolve {Object} - Standard object like {vk: EasyVK, vkr: Response}
	 *  @reject {Error} - vk.com error response or request module error
     *
	 */

	async call(methodName, data = {}, methodType="get") {
		let self = this;

		return new Promise((resolve, reject) => {

			function reCall (_needSolve, _resolverReCall, _rejecterReCall) {
				
				if (!staticMethods.isObject(data)) reject(new Error("Data must be an object"));
				if (!data.access_token) data.access_token = self.session.access_token;
				if (!data.v) data.v = self.params.api_v;
				if (!data.captcha_sid) data.captcha_sid = self.params.captcha_sid;
				if (!data.captcha_key) data.captcha_key = self.params.captcha_key;

				return staticMethods.call(methodName, data, methodType, self.debugger).then((vkr) => {
					
					if (_needSolve) {
						try {
							_resolverReCall(true);
						} catch (e) {}
					}

					return resolve({
						vkr: vkr,
						vk: self
					});

				}).catch((err) => {

					try {

						let vkr = JSON.parse(err.message);

						if (vkr.error === "need_captcha" || vkr.error.error_code === 14) {

							if (_needSolve) {
								
								try {
									_rejecterReCall({
										error: false,
										reCall: () => {
											return reCall();
										}
									});
								} catch (e) {}

								return;
							}


							//Captcha error, handle it
							const captcha_sid = vkr.error.captcha_sid || vkr.captcha_sid;
							const captcha_img = vkr.error.captcha_img || vkr.captcha_img;
							let paramsForHandler = {captcha_sid, captcha_img, vk: self};

							paramsForHandler.resolve = (captcha_key) => {
								return new Promise((resolvedCaptcha, rejectCaptcha) => {
									data.captcha_key = captcha_key;
									data.captcha_sid = captcha_sid;
									
									try {
										let reCalled = reCall('NEED SOLVE', resolvedCaptcha, rejectCaptcha);
									} catch (errorRecall) {/*Need pass it*/}

								});
							}

							self.captchaHandler(paramsForHandler);

						} else {
							reject(err);
						}
						
					} catch (e) {
						reject(err);
					}

				});
			}

			reCall();

		});
	}


	
	/**
	 *  
	 *  This function saves your session chnages to a params.sessionf_file file
	 * 
	 *  @return EasyVK
	 *
	 */

	saveSession () {
		let self, s;

		self = this;
		s = JSON.stringify(self.session);
		
		fs.writeFileSync(self.params.session_file, s);


		return self;
	}
}

module.exports = EasyVK;
