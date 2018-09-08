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
const easyVKRequestsDebugger = require("./utils/debugger.js");
const easyVKBotsLongPoll = require("./utils/botslongpoll.js");
const easyVKSession = require("./utils/session.js");
const easyVKHttp = require("./utils/http.js");
const easyVKErrors = require("./utils/easyvkErrors.js");


/**
 *  EasyVK module. In this module creates session by your params
 *  And then you will get a EasyVK object (Session creates in the easyvkInit.js file)
 *  Author: @ciricc
 *  License: MIT
 *  
 */


class EasyVK {

	//Here will be created session
	constructor (params, resolve, reject, debuggerRun) {
		
		let session = {}, 
		self = this;

		self.params = params;
		self.debugger = new easyVKRequestsDebugger(self);
		self.debuggerRun = debuggerRun || self.debugger;
		self._errors = easyVKErrors;


		self._errors.setLang(params.lang);

		if (!params.reauth) {
			
			let data = fs.readFileSync(params.session_file);

			if (data) {
				
				try {
					data = JSON.parse(data);

					if (data.access_token) {
						session = new easyVKSession(self, data);
						initToken();
					} else {
						
						if (!(params.username && params.password) && !params.access_token) {
							return reject(self._error("empty_session"));
						}

					}

				} catch (e) {
					
					if (!(params.username && params.password) && !params.access_token) {
						return reject(self._error("session_not_valid"));
					}

				}

			} else {
				
				if (!(params.username && params.password) && !params.access_token) {
					return reject(self._error("empty_session"));
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
					client_id: params.client_id || configuration.WINDOWS_CLIENT_ID,
					client_secret: params.client_secret || configuration.WINDOWS_CLIENT_SECRET,
					grant_type: "password",
					v: params.api_v,
					lang: params.lang
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

				if (self.debuggerRun) {
					try {
						self.debuggerRun.push("request", configuration.BASE_OAUTH_URL + "token/?" + getData);
					} catch (e) {
						//Ignore
					}
				}

				request.get(configuration.BASE_OAUTH_URL + "token/?" + getData, (err, res) => {
					

					if (err) {
						return reject(new Error(`Server was down or we don't know what happaned [responseCode ${res.statusCode}]`));
					}


					let vkr = res.body;

					if (self.debuggerRun) {
						try {
							self.debuggerRun.push("response", vkr);
						} catch (e) {
							//Ignore
						}
					}

					if (vkr) {
						console.log(vkr);
						let json = staticMethods.checkJSONErrors(vkr, reject);						
						
						if (json) {
							self.session = new easyVKSession(self, json);
							initResolve(self);
						}

					} else {
						
						return reject(self._error("empty_response", {
							response: vkr
						}));
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

					if (self.debuggerRun) {
						try {
							self.debuggerRun.push("response", vkr);
						} catch (e) {
							//Ignore
						}
					}

					if (vkr) {
						let json = staticMethods.checkJSONErrors(vkr, reject);
						if (json) {
							if (Array.isArray(json) && json.length === 0) {
								groupToken();
							} else {
								session.user_id = json[0].id;
								session.first_name = json[0].first_name;
								session.last_name = json[0].last_name;
								self.session = session;
								initResolve(self);
							}

						}

					} else {

						return reject(self._error("empty_response", {
							response: vkr,
							where: 'in auth with token (user)'
						}));

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
				v: params.api_v,
				lang: params.lang
			});

			if (self.debuggerRun) {
				try {
					self.debuggerRun.push("request", configuration.BASE_CALL_URL + "groups.getById?" + getData);
				} catch (e) {
					//Ignore
				}
			}

			request.get(configuration.BASE_CALL_URL + "groups.getById?" + getData, (err, res) => {
				
				if (err) {
					return reject(new Error(err));
				}

				let vkr = res.body;
				
				if (self.debuggerRun) {
					try {
						self.debuggerRun.push("response", vkr);
					} catch (e) {
						//Ignore
					}
				}
				
				if (vkr) {
					
					let json = staticMethods.checkJSONErrors(vkr, reject);

					if (json) {
						
						if (Array.isArray(json) && json.length === 0) {
							reject(self._error("access_token_not_valid"));
						} else {
							session.group_id = json[0].id,
							session.group_name = json[0].name;
							session.group_screen =  json[0].screen_name;

							self.session = session;
							initResolve(self);
						}

					}

				} else {
					return reject(self._error("empty_response", {
						response: vkr,
						where: 'in auth with token (group)'
					}));
				}

			});
		}

		function initResolve (s) {
			

			if (params.clean_session_file) {
				fs.writeFileSync(params.session_file, "{}");
			}

			if (!params.captchaHandler || !Object.prototype.toString.call(params.captchaHandler).match(/Function/)) {
				params.captchaHandler = ({captcha_sid, captcha_key}) => {
					throw self._error("captcha_error", {
						captcha_key: captcha_key,
						captcha_sid: captcha_sid,
					});
				}
			}

			
			self.captchaHandler = params.captchaHandler;			
			self.uploader = new easyVKUploader(self);
			self.longpoll = new easyVKLongPoll(self);
			self.config = configuration;
			self.callbackAPI = new easyVKCallbackAPI(self);
			self.streamingAPI = new easyVKStreamingAPI(self);
			self.widgets = new easyVKWidgets(self);
			self.bots = {};
			self.bots.longpoll = new easyVKBotsLongPoll(self);

			//http module for http requests from cookies and jar session
			self.http = new easyVKHttp(self);

			
			//Re init all cases
			self.session = new easyVKSession(self, self.session);

			Object.defineProperty(self, 'helpers', {
				get: () => {
					throw self._error("method_deprecated", {
						from: '1.3.0',
						method: 'helpers'
					});
				}
			});

			if (params.save_session) self.session.save();


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
				if (!data.lang) {
					data.lang = self.params.lang;
				}

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
	 *  @deprecated
	 *  @return EasyVK
	 *
	 */

	saveSession () {
		let self = this;

		throw self._error("method_deprecated", {
			from: '1.2',
			method: 'saveSession'
		});

		return self;
	}


	//Ony for mer
	_error(...args) {
		let self = this;
		return self._errors.error(...args);
	}

}

module.exports = EasyVK;

module.exports.version = "1.6.0";
module.exports.callbackAPI = new easyVKCallbackAPI({});
module.exports.streamingAPI = new easyVKStreamingAPI({});