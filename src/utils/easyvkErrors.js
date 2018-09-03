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
				ru_description: "JSON файл сессии имеет не правильный формат"
			},
			"session_not_found": {
				code: 2,
				description: "Session file not found",
				ru_description: "Файл сессии не найден"
			},
			"empty_session": {
				code: 3,
				description: "Session file is empty",
				ru_description: "Файл сессии пустой"
			},
			"empty_response": {
				code: 4,
				description: "Server response is empty",
				ru_description: "Ответ сервера пустой"
			},
			"access_token_not_valid": {
				code: 5,
				description: "Access token is not valid",
				ru_description: "Access токен не правильный"
			},
			"captcha_error": {
				code: 6,
				description: "You need to solve the captcha, please put the solution to the captcha_key parameter or use captchaHandler to automaticly solve it",
				ru_description: "Необходимо решить капчу, вставьте в параметр captcha_key код с картинки или используйте captchaHandler для того, чтобы решать капчу автоматически"
			},
			"method_deprecated": {
				code: 7,
				description: "This method is deprecated",
				ru_description: "Этот метод был удален (устарел)"
			},
			"is_not_string": {
				code: 8,
				description: "This parameter is not a string",
				ru_description: "Параметр должен быть строкой"
			},
			"live_not_streaming": {
				code: 9,
				description: "The live video is not online now",
				ru_description: "Live трансляция в данный момент не транлируется"
			},
			"live_error": {
				code: 10,
				description: "Maybe VK algo was changed, but we can't parse the views count for this video",
				ru_description: "Может быть, алгоритмы ВКонтакте были изменены, но сейчас мы не можем получить количество просмотров этой странсляции"
			},
			"server_error": {
				code: 11,
				description: "Server is down or we don't know what happaned",
				ru_description: "Сервер упал, или нам неизвестно, что произошло"
			},
			"invalid_response": {
				code: 12,
				description: "Server response is not in JSON format",
				ru_description: "Сервер ответил не в формате JSON"
			},
			"is_not_object": {
				code: 13,
				description: "This parameter is not an object",
				ru_description: "Параметр должен быть объектом"
			},
			"upload_url_error": {
				code: 14,
				description: "upload_url is not defied in vk response",
				ru_description: "upload_url не указан в ответе сервера"
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

		let notHaveError = 'We don\'t have this error in the EasyVKErrors object!';

		if (self._lang == 'ru') {
			notHaveError = 'Данная ошибка не описана в объекте EasyVKErrors';
		}

		return new Error(notHaveError);

	}

	setLang (lang = 'ru') {
		let self = this;

		self._lang = String(lang);
	}

}

module.exports = new EasyVKErrors;
