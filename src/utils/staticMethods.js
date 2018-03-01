"use strict";
const configuration = require("./configuration.js");
const request = require("request");

class EasyVK {

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
		return Object.keys(object).map(prop=>prop+'='+object[prop]).join('&');
	}

	static async call (methodName, data) {
		let self = this;
		return new Promise ((resolve, reject) => {
			
			if (!self.isObject(configuration)) reject(new Error("configuration must be an object"));
			if (!configuration.BASE_CALL_URL) reject(new Error("BASE_CALL_URL must be declared in configuration parameter"));
			
			if (methodName) methodName = methodName.toString();
			else reject(new Error("Put method name in your call request!"));
			if (data) {
				if (!self.isObject(data)) {
					reject(new Error("Data params must be an object"));
				}
			}

			if (!data.v) data.v = configuration.api_v;
			
			data = self.urlencode(data);

			request.get(configuration.BASE_CALL_URL + methodName + "?" + data, (err, res) => {
				if (err) reject(new Error(err));
				let vkr = res.body;

				if (vkr) {
					let json = self.checkJSONErrors(vkr, reject);
					
					if (json) {
						resolve(json);
					} else {
						reject(new Error("JSON is not valid... oor i don't know"));
					}

				} else {
					reject(new Error(`Empty response ${vkr}`));
				}

			});

		});
	}

	// Only for me, but you can use it if understand how

	static checkErrors(rvk) {

		try {
			if (rvk.error) {
				

				if (rvk.error === "need_captcha" || rvk.error.error_code === 14) {
					return rvk;
				} else if (rvk.error === "need_validation") {
					var type = "sms";
					if (rvk.validation_type.match('app')) type = "app";
					return `Please, enter your ${type} code in code parameter!`;
				}

				if (rvk.error.error_msg) {
					return rvk.error.error_msg;
				} else if (rvk.error.message) {
					return rvk.error.message;
				} else {
					return rvk.error_description;
				}
			}
		} catch (e) {
			return e;
		}
	}

	static encodeHTML (text) {
		return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
		.replace(/&quot;/g, "\"")
		.replace(/&#039;/g, "'");
	}

	static isString (n) {
		if (n === undefined) n = this;
		return Object.prototype.toString.call(n) === "[object String]";
	}

	static isObject (n) {
		return Object.prototype.toString.call(n) === "[object Object]";
	}

	static checkJSONErrors (data, reject) {
		let self = this;

		try {
			data = JSON.parse(data);
			
			let err = self.checkErrors(data);
			
			if (err) {
				reject(new Error(err));

				return false;
			}

			return data;

		} catch (e) {
			reject(new Error(e));
		}

		return false;
	}
}

module.exports = EasyVK;