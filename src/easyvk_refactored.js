"use strict";

let request = require("request");
let encoding = require("encoding");
let fs = require("fs");
let http = require("http");

module.exports = createSession;
module.exports.static = require("./utils/staticMethods.js");
module.exports.version = "0.3.2";

let configuration = {};

configuration.api_v = "5.73";
configuration.reauth = false;
configuration.save_session = true;
configuration.session_file = __dirname + "/.vksession";
configuration.PROTOCOL = "https";
configuration.BASE_DOMAIN = "vk.com";
configuration.BASE_CALL_URL = configuration.PROTOCOL + "://" + "api." + configuration.BASE_DOMAIN + "/method/";
configuration.BASE_OAUTH_URL = configuration.PROTOCOL + "://" + "oauth." + configuration.BASE_DOMAIN + "/";
configuration.WINDOWS_CLIENT_ID = "2274003";
configuration.WINDOWS_CLIENT_SECRET = "hHbZxrka2uZ6jB1inYsH";

function isString (n) {
	if (n === undefined) n = this;
	return Object.prototype.toString.call(n) === "[object String]";
}

async function createSession (params = {}) {
	return new Promise((resolve, reject) => {
		
		if (params.save_session !== false) params.save_session = configuration.save_session;
		
		if (params.session_file) {
			if (!isString(params.session_file)) reject(new Error("The session_file must be a string"));
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
				if (!isString(params.access_token)) reject(new Error("The access_token must be a string"));
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
		
		if (!params.reauth) {
			let data = fs.readFileSync(params.session_file);
			if (data) {
				
				try {
					data = JSON.parse(data);
					 
					if (data.access_token) {
						session.access_token = resolve;
					} else {
						if (!(params.username && params.password) || !params.access_token) reject(new Error("Session file is empty, please, put a login data"));
					}

				} catch (e) {

				}

			} else {
				if (!(params.username && params.password) || !params.access_token) reject(new Error("Session file is empty, please, put a login data"));
			}
		}
	}
}