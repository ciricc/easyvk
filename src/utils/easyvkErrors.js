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
				ru_description: "Необходимо решить капчу, вставьте в параметр captcha_key код с картинки или используйте captchaHandler для того, чтобы решать капчу автоматически"
			},
			"method_deprecated": {
				code: 7,
				description: "This method was deprecated",
				ru_description: "Этот метод был удален"
			},
			"is_not_string": {
				code: 8,
				description: "This parameter is not string",
				ru_description: "Параметр должен быть строкой"
			},
			"live_not_streaming": {
				code: 9,
				description: "The live video is not streaming now",
				ru_description: "Live трансляция в данный момент не транлируется"
			},
			"live_error": {
				code: 10,
				description: "Maybe VK algo was changed, but we can't parse count of views from this video",
				ru_description: "Может быть, алгоритмы ВКонтакте были изменены, но сейчас мы не можем получить количество просмотров этой странсляции"
			},
			"server_error": {
				code: 11,
				description: "Server was down or we don't know what happaned",
				ru_description: "Сервер упал, или нам неизвестно, что произошло"
			},
			"invalid_response": {
				code: 12,
				description: "Server responsed us with not a JSON format",
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

		let notHaveError = 'Not have this error in EasyVKErrors object!';

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
module.exports.EasyVKError = EasyVKError;
