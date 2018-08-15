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
				description: "JSON in session file is not valid",
				ru_description: "JSON файла сессии не имеет правильный формат"
			},
			"session_not_found": {
				code: 2,
				description: "Session file is not found",
				ru_description: "Файл сессии не найден"
			},
			"empty_session": {
				code: 3,
				description: "Session file is empty",
				ru_description: "Файл сессии пустой"
			},
			"empty_response": {
				code: 4,
				description: "The server responsed us with empty data",
				ru_description: "Ответ сервера пришел пустым"
			},
			"access_token_not_valid": {
				code: 5,
				description: "Access token not valid",
				ru_description: "Access токен не правильный"
			},
			"captcha_error": {
				code: 6,
				description: "You need solve it and then put to params captcha_key, or use captchaHandler for solve it automatic",
				ru_description: "Необходимо решить капчу, вставьте в параметр captcha_key код с картинки или используйте captchaHandler для того, чтобы решать автоматически"
			},
			"method_deprecated": {
				code: 7,
				description: "This method was deprecated",
				ru_description: "Этот метод был удален"
			}
		}


		self._errors = errors;
	}

	error(name = '', data = {}) {
		
		let self = this;

		name = String(name);
			
		if (self._errors[name]) {
			
			let err = self._errors[name];

			if (err[self._lang + '_description']) {
				err.description = err[self._lang + '_description'];
			}

			return new EasyVKError(err, name, data);
		}

		return new Error('Not have this error in EasyVKErrors object!');

	}

	setLang (lang = 'ru') {
		let self = this;

		self._lang = String(lang);
	}

}

module.exports = new EasyVKErrors;
