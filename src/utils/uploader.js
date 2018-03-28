
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
			
			if (!url) {
				return reject(new Error("put website url for upload this file"));
			} else if (!staticMethods.isString(url)) {
				return reject(new Error("website url must be a string"));
			}


			if (!filePath) {
				return reject(new Error("put file's path in second argument"));
			} else if (!staticMethods.isString(filePath)) {
				return reject(new Error("file's path must be a string"));
			}


			if (fieldName) {
				
				if (!staticMethods.isString(fieldName)) {
					return reject(new Error("field name must be a string"));
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
				
				request.post({
					uri: url,
					formData: data,
				}, (err, response) => {
					
					if (err) {
						return reject(new Error(`Server was down or we don't know what happaned [error ${err}]`));
					}

					if (!response) response = {};

					let vkr = response.body;

					if (vkr) {
						let json = staticMethods.checkJSONErrors(vkr);
						
						if (json) {
							
							return resolve({
								vkr: json,
								vk: self._vk
							});

						} else {
							return reject(new Error("Response from vk is not a json"));
						}

					} else {
						return reject(new Error("Server responsed with empty string!"));
					}

				});

			});
		});
	}

	async getUploadURL (method_name, params = {}, returnAll=false) {
		let self = this;

		return new Promise((resolve, reject) => {
			
			if (!staticMethods.isObject(params)) {
				return reject(new Error("Params must be an object"));
			}
			
			self._vk.call(method_name, params).then(({vkr, vk}) => {
				
				if (vkr.response.upload_url) {
					
					if (returnAll) {
						return resolve({
							url: vkr,
							vkr: vkr,
							vk: self._vk
						});
					} else  {
						return resolve({
							url: vkr.response.upload_url,
							vk: vk
						});
					}
						
				} else {
					return reject(new Error("upload_url is not defied in vk response"));
				}

			}, reject);
			
		});
	}
}


module.exports = EasyVKUploader;