
/*
	
	Author: ciricc (Kirill Novak)
	License: MIT
	Description : EasyVK is library for creating appliations based on npm and VKontakte API
	Copyright (c) 2017-2018 Kirill Novak (https://ciricc.github.io/) 
	ALL UTILITIES OF THIS MODULE ARE DISTRIBUTED UNDER THE SAME LICENSE AND RULES
	Docs: https://ciricc.github.io/
*/

"use strict";

const staticMethods = require("./utils/staticMethods.js");
const configuration = require("./utils/configuration.js");

const EasyVK = require("./easyvk.js");


module.exports = createSession;
module.exports.static = staticMethods;

module.exports.version = EasyVK.version;
module.exports.callbackAPI = EasyVK.callbackAPI;
module.exports.streamingAPI = EasyVK.streamingAPI;


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
			}

		} else {
			params.api_v = configuration.api_v;
		}



		if (params.captcha_key && !params.captcha_sid) {
			return reject(new Error("You puted captcha_key but not using captcha_sid parameter"));
		} else if (!params.captcha_key && params.captcha_sid) {
			return reject(new Error("You puted captcha_sid but not puted captcha_key parameter"));
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
				return reject(new Error("You want reauth, but you don't puted username and pass or only access_token"));
			}

			if (params.access_token && params.username) {
				return reject(new Error("Select only one way auth: access_token XOR username"));
			}

			if (params.access_token) {
				
				if (!staticMethods.isString(params.access_token)) {
					return reject(new Error("The access_token must be a string"));
				}

			}

			if (params.username && !params.password) {
				return reject(new Error("Put password if you want aut with username"));
			}

			if (params.username && params.password) {
				params.username = params.username.toString();
				params.password = params.password.toString();
			}

		}


		resolve(params)



	});
}

async function createSession (params = {}) {
	return new Promise((resolve, reject) => {
		
		checkInitParams(params).then((p) => {
			
			return new EasyVK(p, resolve, reject);

		}, reject);

	});
}