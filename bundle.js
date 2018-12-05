'use strict';

const configuration = require("./configuration.js");
const request = require("request");
const VKResponseError = require('./VKResponseError.js');
const VKResponse = require('./VKResponse.js');
const fetch = require('node-fetch');

console.log(module.parent);


class EasyVKStaticMethods {

	/**
	 *
	 *	This function return a GET url with parameters. If you want get url encoded string from object you can use it.
	 *
	 *	@param {Object} object it is clear, man! it just a object.................. :(
	 *	
	 *	@return {String}
     *
	 */

	static urlencode(object = {}) { 
		
		let self = this;

		return Object.keys(object)
		.map(prop => 
			prop + '=' + (
				(self.isObject(object[prop])) ? 
					(encodeURIComponent(JSON.stringify(object[prop]))) : encodeURIComponent(object[prop])
			)
		)
		.join('&');

	}

	static async call (methodName, data, methodType, debuggerIS) {
		let self = this;
		return new Promise ((resolve, reject) => {
			

			if (!methodType) {
				methodType = "get";
			}

			let methodType__lower = methodType.toString().toLocaleLowerCase();

			if (["get", "post", "delete", "put"].indexOf(methodType__lower) === -1) {
				methodType = "get";
			}	

			
			if (!self.isObject(configuration)) {
				return reject(new Error("configuration must be an object"));
			}

			if (!configuration.BASE_CALL_URL) {
				return reject(new Error("BASE_CALL_URL must be declared in configuration parameter"));
			}

			
			if (methodName) {
				methodName = methodName.toString();
			} else {
				return reject(new Error("Put method name in your call request!"));
			}

			if (data) {
				
				if (!self.isObject(data)) {
					return reject(new Error("Data params must be an object"));
				}

			}

			if (!data.v) {
				data.v = configuration.api_v;
			}

			
			
			let callParams = {
				url: configuration.BASE_CALL_URL + methodName,
			};

			if (methodType.toLocaleLowerCase() === "post") {
				
				callParams.form = data;
				callParams.headers = {
					"content-type" : "application/x-www-form-urlencoded",
				};

				//Nice request recommendtion
				for (let i in callParams.form) {
					if (self.isObject(callParams.form[i])) {
						callParams.form[i] = JSON.stringify(callParams.form[i]);
					}
				}

			} else {
				
				let encoded = self.urlencode(data);
				callParams.url += "?" + encoded;
			}

			if (debuggerIS) {
				try {
					debuggerIS.push("request", callParams.url);
				} catch (e) {
					return reject(new Error("Not a normal debugger"));
				}
			}

			if (debuggerIS) {
				try {
					debuggerIS.push("fullRequest", callParams);
				} catch (e) {
					//Ignore
				}
			}

			let req = request[methodType];

			req(callParams, (err, res) => {


				if (err) {
					return reject(new Error(err));
				}

				let vkr = res.body;

				if (debuggerIS) {
					try {
						debuggerIS.push("response", vkr);
					} catch (e) {
						return reject(new Error("Not a normal debugger"));
					}
				} 

				if (vkr) {
					
					let json = self.checkJSONErrors(vkr, reject);	

					if (json) {
						return resolve(json);
					} else {
						return reject(new Error("JSON is not valid... oor i don't know"));
					}

				} else {
					return reject(new Error(`Empty response ${vkr}`));
				}

			});

		});
	}

	// Only for me, but you can use it if understand how

	static checkErrors(vkr) {
		try {
			if (vkr.error) {
				

				if (vkr.error === "need_captcha" || vkr.error.error_code === 14) {
					return JSON.stringify(vkr);
				} else if (vkr.error === "need_validation") {

					if (vkr.ban_info) {
						return vkr.error_description;
					} else {
						if (vkr.validation_type.match('app')) ;
					}

					return `Please, enter your ${type} code in code parameter!`;

				} else if (vkr.error.error_code === 17) {
					return JSON.stringify({
						redirect_uri: vkr.error.redirect_uri,
						error: vkr.error.error_msg,
						error_code: vkr.error.error_code
					});
				}

				if (vkr.error.error_msg) {
					return new VKResponseError(vkr.error.error_msg, vkr.error.error_code, vkr.error.request_params);
				} else if (vkr.error.message) {
					return new VKResponseError(vkr.error.message, vkr.error.code, vkr.error.params);
				} else {
					return new VKResponseError(vkr.error_description, vkr.error);
				}

			}
		} catch (e) {
			return e;
		}
	}

	/* 
	 *	
	 *  @deprecated
	 *
	 */
	static encodeHTML (text) {
		throw new Error('This method was deprecated from 2.0 version!');
	}

	static isString (n) {
		
		if (n === undefined) {
			n = this;
		}

		return Object.prototype.toString.call(n) === "[object String]";
	}

	static isObject (n) {
		return Object.prototype.toString.call(n) === "[object Object]";
	}

	static checkJSONErrors (vkr, reject) {
		let self = this;

		try {
			vkr = JSON.parse(vkr);
			
			let err = self.checkErrors(vkr);
			
			if (err) {

				if (self.isString(err)) {
					//new error
					err = new Error(err);
				} else if (err instanceof Error) {

					err = err; //ok? :D
				}

				reject(err);

				return false;
			}

			return VKResponse(self, vkr);

		} catch (e) {
			return reject(new Error(e));
		}

		return false;
	}
}

module.exports = EasyVKStaticMethods;

const request$1 = require("request");
const encoding = require("encoding");
const fs = require("fs");

const easyVKUploader = require("./utils/uploader.js");
const easyVKLongPoll = require("./utils/longpoll.js");
const easyVKCallbackAPI = require("./utils/callbackapi.js");
const easyVKStreamingAPI = require("./utils/streamingapi.js");
const easyVKWidgets = require("./utils/widgets.js");
const configuration$1 = require("./utils/configuration.js");
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
						
						if (!(params.username && params.password) && !params.access_token && !params.client_id && params.client_secret) {
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
					client_id: params.client_id || configuration$1.WINDOWS_CLIENT_ID,
					client_secret: params.client_secret || configuration$1.WINDOWS_CLIENT_SECRET,
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
						self.debuggerRun.push("request", configuration$1.BASE_OAUTH_URL + "token/?" + getData);
					} catch (e) {
						//Ignore
					}
				}

				request$1.get(configuration$1.BASE_OAUTH_URL + "token/?" + getData, (err, res) => {
					

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
						let json = staticMethods.checkJSONErrors(vkr, reject);						
						
						if (json) {
							session = JSON.parse(JSON.stringify(json));
							session.user_id = null;
							initToken();
						}

					} else {
						
						return reject(self._error("empty_response", {
							response: vkr
						}));
					}

				});

			} else if (params.client_id) {

				let getData = {
					client_id: params.client_id || configuration$1.WINDOWS_CLIENT_ID,
					client_secret: params.client_secret || configuration$1.WINDOWS_CLIENT_SECRET,
					grant_type: "client_credentials",
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
						self.debuggerRun.push("request", configuration$1.BASE_OAUTH_URL + "token/?" + getData);
					} catch (e) {
						//Ignore
					}
				}

				request$1.get(configuration$1.BASE_OAUTH_URL + "token/?" + getData, (err, res) => {
					

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
						let json = staticMethods.checkJSONErrors(vkr, reject);						
						
						if (json) {
							session = JSON.parse(JSON.stringify(json));
							session.user_id = null;
							session.credentials_flow = 1;
							initToken();
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

				if (session.credentials_flow) {

					self.__credentials_flow_type = true;
					self.session = session;
					
					initResolve(self);

				} else {
					getData = {
						access_token: token,
						v: params.api_v,
						fields: params.fields.join(",")
					};

					getData = staticMethods.urlencode(getData);

					request$1.get(configuration$1.BASE_CALL_URL + "users.get?" + getData, (err, res) => {
						
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
									appToken();
								} else {
									session.user_id = json[0].id;
									session.first_name = json[0].first_name;
									session.last_name = json[0].last_name;

									for (let i = 0; i < params.fields.length; i++) {
										if (json[0][params.fields[i]]) {
											session[params.fields[i]] = json[0][params.fields[i]];
										}
									}

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
				}

			} else {
				self.session = session;
				initResolve(self);
			}
		}

		function appToken () {
			let getData;

			getData = staticMethods.urlencode({
				access_token: params.access_token,
				v: params.api_v,
				lang: params.lang,
				fields: params.fields.join(",")
			});


			if (self.debuggerRun) {
				try {
					self.debuggerRun.push("request", configuration$1.BASE_CALL_URL + "groups.getById?" + getData);
				} catch (e) {
					//Ignore
				}
			}

			request$1.get(configuration$1.BASE_CALL_URL + "apps.get?" + getData, (err, res) => {
				
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
					
					let json;

					json = staticMethods.checkJSONErrors(vkr, (e) => {
						if (e.error_code == 5) {
							groupToken();
						} else {
							reject(e);
						}
					});
					


					if (json) {
						
						json = json.items[0];

						if (Array.isArray(json) && json.length === 0) {
							groupToken();
						} else {

							
							session.app_id = json.id;
							session.app_title = json.title;
							session.app_type = json.type;
							session.app_icons = [json.icon_75,json.icon_150];
							session.author = {
								id: json.author_id
							};

							session.app_members = json.members_count;

							for (let i = 0; i < params.fields.length; i++) {
								if (json[params.fields[i]]) {
									session[params.fields[i]] = json[params.fields[i]];
								}
							}

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

		function groupToken () {

			let getData;

			
			getData = staticMethods.urlencode({
				access_token: params.access_token,
				v: params.api_v,
				lang: params.lang,
				fields: params.fields.join(",")
			});

			if (self.debuggerRun) {
				try {
					self.debuggerRun.push("request", configuration$1.BASE_CALL_URL + "groups.getById?" + getData);
				} catch (e) {
					//Ignore
				}
			}

			request$1.get(configuration$1.BASE_CALL_URL + "groups.getById?" + getData, (err, res) => {
				
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
							
							for (let i = 0; i < params.fields.length; i++) {
								if (json[0][params.fields[i]]) {
									session[params.fields[i]] = json[0][params.fields[i]];
								}
							}

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
				};
			}

			
			self.captchaHandler = params.captchaHandler;			
			self.uploader = new easyVKUploader(self);
			self.longpoll = new easyVKLongPoll(self);
			self.config = configuration$1;
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
				
				let d = new Date().getTime();

				if (!staticMethods.isObject(data)) reject(new Error("Data must be an object"));
				if (!data.access_token) data.access_token = self.session.access_token;
				if (!data.v) data.v = self.params.api_v;
				if (!data.captcha_sid) data.captcha_sid = self.params.captcha_sid;
				if (!data.captcha_key) data.captcha_key = self.params.captcha_key;
				if (!data.lang) {
					data.lang = self.params.lang;
				}

				self.debugger._d = d;
				
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
							};

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

function is (obj1, obj2) {
	return obj1.__proto__.constructor.name === obj2;
}


module.exports = EasyVK;
module.exports.is = is;
module.exports.class = {
	VKResponse: "VKResponse",
	VKResponseError: "VKResponseError",
	EasyVKError: "EasyVKError",
	AudioItem: "AudioItem"
};


module.exports.version = "2.0.1";
module.exports.callbackAPI = new easyVKCallbackAPI({});
module.exports.streamingAPI = new easyVKStreamingAPI({});
