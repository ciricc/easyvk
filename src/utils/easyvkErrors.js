const fs = require("fs");

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

		let errors = {}

		errors = JSON.parse(fs.readFileSync(__dirname + "/evkerrors.json").toString());

		self._errors = errors;
	}

	error(name = "", data = {}, parent = "") {
		
		let self = this;

		console.log(name, parent);
		
		name = String(name);
		parent = String(parent);

		if (self._errors[name]) {
			let err;

			if (self._errors[name]["errors"][parent]) {
				
				err = self._errors[name]["errors"][parent];
				err.code += (self._errors[name]["parent_hash"] || -100000);

			} else {
				err = self._errors[name];
			}

			if (err[self._lang + '_description']) {
				err.description = err[self._lang + '_description'];
			}

			let string_id = name;
				
			if (self._errors[name]["errors"][parent]) {
				string_id = name + "\\" + parent;
			}

			return new EasyVKError(err, string_id, data);
		}

		let notHaveError = "Not have this error in EasyVKErrors object!";

		if (self._lang == "ru") {
			notHaveError = "Данная ошибка не описана в объекте EasyVKErrors";
		}

		return new Error(notHaveError);

	}

	setLang (lang = "ru") {
		let self = this;

		self._lang = String(lang);
	}

}

module.exports = new EasyVKErrors;
module.exports.EasyVKError = EasyVKError;
