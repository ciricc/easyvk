"use strict";

let fs = require("fs");
let request = require("request");
let staticMethods = require("./staticMethods.js");

/*

	This util contents all upload functions and working with files
	(Only for upload)

*/


class EasyVKUploader {
	
	constructor (vk) {
		let self = this;
		self._vk = vk;
	}

	async uploadFile (url, filePath, fieldName="") {
		return new Promise((resolve, reject) => {
			
			if (!url) reject(new Error("put website url for upload this file"));
			else if (!staticMethods.isString(url)) reject(new Error("website url must be a string"));

			if (!filePath) reject(new Error("put file's path in second argument"));
			else if (!staticMethods.isString(filePath)) reject(new Error("file's path must be a string"));

			if (fieldName) if (!staticMethods.isString(fieldName)) reject(new Error("field name must be a string"));

			let stream = fs.createReadStream(filePath);
			let data = {};

			stream.on("error", (error) => {
				reject(new Error(error));
			});

			stream.on("open", () => {
				data[fieldName] = stream;
				request.post({
					uri: url,
					formData: data
				}, (err, response) => {
					
					if (err) {
						reject(new Error(`Server was down or we don't know what happaned [responseCode ${res.statusCode}]`));
					}

					let vkr = response.body;

					if (vkr) {
						let json = staticMethods.checkJSONErrors(vkr);
						
						if (json) {
							resolve(json);
						} else {
							reject(new Error("Response from vk is not a json"));
						}

					} else {
						reject(new Error("Server responsed with empty string!"));
					}


				});
			});
		});
	}
}


module.exports = EasyVKUploader;