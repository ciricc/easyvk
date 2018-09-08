
/*
 *	@author: ciricc (Kirill Novak)
 *	@license: MIT
 * 	@description : This library helps you easily create apps with vk api! Official VK API: vk.com/dev/
 *	
 *	Copyright (c) 2017-2018 Kirill Novak (https://ciricc.github.io/) 	
 *	ALL UTILITIES OF THIS MODULE ARE DISTRIBUTED UNDER THE SAME LICENSE AND RULES
 *	Docs: https://ciricc.github.io/
 */


"use strict";

const staticMethods = require("./utils/staticMethods.js");
const configuration = require("./utils/configuration.js");
const easyVKRequestsDebugger = require("./utils/debugger.js");

const EasyVK = require("./easyvk.js");

let debuggerRun = new easyVKRequestsDebugger(Boolean(false));
		

module.exports = createSession;

module.exports.static = staticMethods;
module.exports.debuggerRun = debuggerRun;
module.exports.version = EasyVK.version;
module.exports.callbackAPI = EasyVK.callbackAPI;
module.exports.streamingAPI = EasyVK.streamingAPI;







/**
 *
 *  This function checks all the parameters
 *  @see createSession()
 *  @return {Promise} 
 *  @promise Cheks errors
 *  @resolve {Object} changed user parameters so they fit our needs
 *  @reject {Error} returns auth errors or just response errors
 *
 */

async function checkInitParams (params = {}) {
	return new Promise((resolve, reject) => {
		
		if (params.save_session !== false) {
			params.save_session = configuration.save_session;
		}

		
		if (params.session_file) {
			
			if (!staticMethods.isString(params.session_file)) {
				return reject(new Error("The session_file must be a string"));
			}

		} else {
			params.session_file = configuration.session_file;
		}


		if (params.api_v && params.api_v !== configuration.api_v) {
			
			if (isNaN(params.api_v.toString())) {
				return reject(new Error("The api_v parameter must be numeric"));
			} else if (Number(params.api_v) < 5) {
				return reject(new Error("The api_v parameter must be more then 5.0"))
			}

		} else {
			params.api_v = configuration.api_v;
		}



		if (params.captcha_key && !params.captcha_sid) {
			return reject(new Error("You put the captcha_key but didn't use the captcha_sid parameter"));
		} else if (!params.captcha_key && params.captcha_sid) {
			return reject(new Error("You put the captcha_sid but didn't put the captcha_key parameter"));
		} else if (params.captcha_key && params.captcha_sid) {
			
			if (isNaN(params.captcha_sid.toString())) {
				return reject(new Error("The captcha_sid must be numeric"));
			}

		}

		if (params.reauth !== true) {
			params.reauth = configuration.reauth;
		}

		
		if (params.reauth) {
			
			if (!(params.password && params.username) && !params.access_token) {                                                                       
				return reject(new Error("You want to reauth, but you didn't put the username and pass or the access_token"));
			}

			if (params.access_token && params.username) {
				return reject(new Error("You can only use one auth method: access_token OR username"));
			}

			if (params.access_token) {
				
				if (!staticMethods.isString(params.access_token)) {
					return reject(new Error("The access_token must be a string"));
				}

			}

			if (params.username && !params.password) {
				return reject(new Error("Put the password in if you want to auth using username"));
			}

			if (params.username && params.password) {
				params.username = params.username.toString();
				params.password = params.password.toString();
			}

		}


		if (params.platform) {
			
			if (!isNaN(Number(params.platform))) {
				// Get platform by ID

				params.platform = configuration.platformIds[params.platform];

			} else {
				
				// Get by matching
				let hashes = [];
				let values = [];

				for (let hash in configuration.platformIds) {
					hashes.push(hash);
					values.push(configuration.platformIds[hash]);
				}

				let platform = params.platform;
				platform = String(platform).toLocaleLowerCase();
				
				let resultPlatform = undefined;

				values.forEach((value, index) => {
					value = value.toLocaleLowerCase();
					if (value.match(platform)) {
						//save it
						resultPlatform = configuration.platformIds[String(hashes[index])];
					}
				});


				if (resultPlatform) {
					params.platform = resultPlatform;
				} else {
					params.platform = undefined;

				}

				hashes = undefined;
				values = undefined;

			}

		}

		if (!params.client_id || !params.client_secret) {
			
			if (params.platform) {
				
				params.client_id = configuration[params.platform + '_CLIENT_ID'];
				params.client_secret = configuration[params.platform + '_CLIENT_SECRET'];

			} else {
				params.client_id = configuration["ANDROID_CLIENT_ID"];
				params.client_secret = configuration["ANDROID_CLIENT_SECRET"];
			}

		}

		params.lang = String(params.lang);
		
		if (!params.lang) {
			params.lang = "ru";
		}

		resolve(params)



	});
}

/*
 *  This function checks your easyVK(params) parameters
 *  @param {Object} params - Settings for authentication (session params)
 *  @param {Boolean} [params.save_session=true] - If true then session will be saved in params.session_file file
 *  @param {(String|Number)} [params.api_v=5.73] - API version for all requests, I recommend using version >= 5
 *  @param {String} [params.access_token=] - Your access token, group or user. If user token then
 *  easyVK will get the user_id for you, else [group_id, screen_name, group_name] will be saved
 *  @param {String|Number} [params.username] - Your login for authentication, your_email@example.com or +7(916)7888886 (example)
 *  This is needed only if you are using the params.password and not the params.access_token parameter
 *  @param {String|Number} [params.password] - Your password for the user account, it will be authenticated
 *  with windows app_id, like official client. I'm not saving your data to hack your account, all is open source
 *  @param {Boolean} [params.reauth=false] - This will disable session file reading
 *  @param {String} [params.session_file=.vksession] - Path for your session file, I recommend you use the path module
 *  to create path.join(__dirname, '.session-vk')
 *  @param {String|Number} [params.code] - This is for 2-factor-auth, pass the code from message here
 *  @param {String} [params.captcha_key] - This is only used if you failed to solve captcha
 *  @param {String|Number} [params.captcha_sid] - This is only used if you failed to solve captcha
 *  @param {Function|Async Function} [params.captchaHandler] - Captcha Handler function to handle all captcha errors
 *
 *  @promise Authenticates you and creates the session
 *  @resolve {Object} EasyVK object, contains the session and all the methods for the VK API
 *  
 */

async function createSession (params = {}) {
	return new Promise((resolve, reject) => {
		
		checkInitParams(params).then((p) => {
			
			

			return new EasyVK(p, resolve, reject, debuggerRun);

		}, reject);

	});
}
