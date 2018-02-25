"use strict";

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