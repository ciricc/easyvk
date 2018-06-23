"use strict";

const configuration = require("./configuration.js");
const request = require("request");

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

			debuggerIS.push("fullRequest", callParams);
			
			request[methodType](callParams, (err, res) => {
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
						let type = "sms";
						
						if (vkr.validation_type.match('app')) {
							type = "app";
						}
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
					return vkr.error.error_msg;
				} else if (vkr.error.message) {
					return vkr.error.message;
				} else {
					return vkr.error_description;
				}

			}
		} catch (e) {
			return e;
		}
	}

	static encodeHTML (text) {
		
		return text.toString()
		.replace(/\<br(\/)?\>/g, "\n")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, "\"")
		.replace(/&#039;/g, "'");

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
				reject(new Error(err));

				return false;
			}

			return vkr;

		} catch (e) {
			return reject(new Error(e));
		}

		return false;
	}
}

module.exports = EasyVKStaticMethods;