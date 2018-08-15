class EasyVKError extends Error {
	constructor (error, name = '', data = {}) {

		super(error.description);

		let self = this;

		self.error_code = error.code
		self.easyvk_error = true;
		self.data = data;
		self.name = name;

	}
}


class EasyVKErrors {
	constructor () {
		let self = this;

		let errors = {
			"session_not_valid": {
				code: 1,
				description: "JSON in session file is not valid"
			},
			"session_not_found": {
				code: 2,
				description: "Session file is not found"
			},
			"empty_session": {
				code: 3,
				description: "Session file is empty"
			},
			"empty_response": {
				code: 4,
				description: "The server responsed us with empty data"
			},
			"access_token_not_valid": {
				code: 5,
				description: "Access token not valid"
			},
			"captcha_error": {
				code: 6,
				description: "You need solve it and then put to params captcha_key, or use captchaHandler for solve it automatic"
			},
			"method_deprecated": {
				code: 7,
				description: "This method was deprecated"
			}
		}


		self._errors = errors;
	}

	error(name = '', data = {}) {
		
		let self = this;

		name = String(name);
		
		if (self._errors[name]) {
			return new EasyVKError(self._errors[name], name, data);
		}

		return new Error('Not have this error in EasyVKErrors object!');

	}

}

module.exports = new EasyVKErrors;
