
/*
 *
 *  This util contents all upload functions and working with files
 *  (Only for upload)
 *  Author: @ciricc
 *  License: MIT
 */

"use strict";

const fs = require("fs");
const request = require("request");
const staticMethods = require("./staticMethods.js");


class EasyVKUploader {
	
	constructor (vk) {
		let self = this;
		self._vk = vk;
	}
   

	async uploadFile (url, filePath, fieldName="", paramsUpload = {}) {
		let self = this;
		return new Promise((resolve, reject) => {
			
			if (!url || !staticMethods.isString(url)) {
				return reject(self._vk._error("is_not_string", {
					parameter: "url",
					method: "uploadFile",
					format: "http(s)://www.domain.example.com/path?request=get"
				}));
			}

			if (!filePath || !staticMethods.isString(filePath)) {
				return reject(self._vk._error("is_not_string", {
					parameter: "filePath",
					method: "uploadFile",
					format: __dirname + '/../example/path'
				}));
			}


			if (fieldName) {
				
				if (!staticMethods.isString(fieldName)) {
					return reject(self._vk._error("is_not_string", {
						parameter: "fieldName",
						method: "uploadFile",
						required: false
					}));
				}

			}

			if (!staticMethods.isObject(paramsUpload)) {
				paramsUpload = {};
			}

			let stream, data;

			stream = fs.createReadStream(filePath);
			data = {};

			Object.keys(paramsUpload)
			.map((param) => {
				(param !== fieldName) ? data[param] = paramsUpload[param] : null;
			});


			stream.on("error", (error) => {
				reject(new Error(error));
			});

			stream.on("open", () => {
				data[fieldName] = stream;
				
				let _data = {};
				_data[fieldName] = stream;

				request.post({
					url: url,
					formData: _data,
					agent: self._agent
				}, (err, response) => {

					if (err) {
						return reject(self._vk._error("server_error", {
							error: err
						}));
					}

					if (!response) response = {};

					let vkr = response.body;

					if (vkr) {

						if (data.custom) {
							
							return resolve({
								vkr: vkr,
								vk: self._vk
							});

						} else {
							let json = staticMethods.checkJSONErrors(vkr, reject);
							
							if (json) {
								
								return resolve({
									vkr: json,
									vk: self._vk
								});

							} else {
								return reject(self._vk._error("invalid_response", {
									response: response
								}));
							}
						}

					} else {
						return reject(self._vk._error("empty_response", {
							response: response
						}));
					}

				});

			});
		});
	}

	async getUploadURL (method_name, params = {}, returnAll=false) {
		let self = this;

		return new Promise((resolve, reject) => {
			
			if (!staticMethods.isObject(params)) {
				return reject(self._vk._error("is_not_object", {
					parameter: "params",
					method: "getUploadURL",
				}));
			}
			
			self._vk.call(method_name, params).then(({vkr, vk}) => {
				
				if (vkr.upload_url) {
					
					if (returnAll) {
						return resolve({
							url: vkr,
							vkr: vkr,
							vk: self._vk
						});
					} else  {
						return resolve({
							url: vkr.upload_url,
							vk: vk
						});
					}
						
				} else {
					return reject(self._vk._error("upload_url_error", {
						response: vkr
					}));
				}

			}, reject);
			
		});
	}
}


module.exports = EasyVKUploader;