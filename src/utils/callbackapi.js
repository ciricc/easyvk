/*
 *  It's a Callbakc API module for EasyVK
 *  You can use it
 *
 *  Author: @ciricc
 *  License: MIT
 *
 */

"use strict";

const http = require("http");
const express = require("express");
const staticMethods = require("./staticMethods.js");
const EventEmitter = require("events");
const bodyParser = require("body-parser");


class CallbackAPI extends EventEmitter {
	
	constructor (vk) {
		super();
		let self = this;
		self._vk = vk;
	}

	__initVKRequest (req, res) {
		
		let postData, params, self;

		self = this;
		postData = req.body;
		params = self._cbparams;
		
		if (!postData.group_id) {
			res.status(400).send("only vk requests");
		}

		let group = self._cbparams.groups[postData.group_id.toString()];

		if (postData.type === "confirmation") {

			if (group) {
				
				if (group.secret) { //If you use a password fro menage it
					
					if (postData.secret && postData.secret.toString() === group.secret.toString()) {
						res.status(200).send(group.confirmCode);
					} else {
						
						res.status(400).send("secret error");
						self.emit("secretError", {
							postData: postData,
							description: "We got the secret key which no uses in your settings! If you want to add secret, set up it in secret parameter!"
						});

					}

				} else {
					res.status(200).send(group.confirmCode);
				}

			} else {
				
				res.status(400).send("not have this group");
				self.emit("confirmationError", {
					postData: postData,
					description: "You don't use this group, becouse we don't know this groupId"
				});

			}

		} else if (postData.type !== "confirmation" ){
			
			if (group) {
				
				if (group.secret) {
					
					if (postData.secret && postData.secret.toString() !== group.secret.toString()) {
						
						res.status(400).send("secret error");
						self.emit("secretError", {
							postData: postData,
							description: "Secret from request and from your settings are not the same"
						});
						
						return;

					} else if (!postData.secret) {
						
						res.status(400).send("secret error");
						self.emit("secretError", {
							postData: postData,
							description: "Request has not a secret password, but you use it in this group"
						});
						
						return;

					}
				}

				if (postData.type) {
					
					self.emit(postData.type, postData);
					res.status(200).send("ok");

				} else {
					
					res.status(400).send("invalid type event");
					self.emit("eventEmpty", {
						postData: postData,
						description: "This request haven't type of event. Event name is empty"
					});

				}

			} else {
				
				res.status(400).send("not have this group");
				self.emit("confirmationError", {
					postData: postData,
					description: "You don't use this group, becouse we don't know this groupId"
				});

			}

		} else {
			res.status(400).send("only vk requests");
		}

	}

	__init404Error (req, res) {
		res.status(404).send("Not Found");
	}

	async __initApp (params = {}) {
		let self = this;

		self._cbparams = params;
		
		return new Promise ((resolve, reject) => {
			if (self._app) { //Only one time
				return reject(new Error("You are listening the server yet!"));	
			} else {
				
				let app, server;

				app = express()
				app.use(bodyParser.json());

				app.post("/", (req, res) => {
					self.__initVKRequest(req, res);
				});
				
				app.get("/", (req, res) => {
					self.__init404Error(req, res);
				});


				server = http.createServer(app);
				
				self._app = app;
				
				server.listen(params.port || process.env.PORT || 3000);
				
				return resolve({
					app: app,
					server: server
				});

			}

		});
	
	}

}

class CallbackAPIConnector {
	
	constructor (vk) {
		let self = this;
		self._vk = vk;
	}

	async listen (callbackParams = {}) {
		let self = this;
	
		return new Promise ((resolve, reject) => {

			if (callbackParams) {
				
				if (!staticMethods.isObject(callbackParams)) {
					callbackParams = {};
				}

			}

			if (!Array.isArray(callbackParams.groups)) {
				callbackParams.groups = [];
			}


			if (callbackParams.groupId) {//If user wants only one group init
				
				if (!callbackParams.confirmCode) {
					return reject(new Error("You don't puted confirmation code"));
				}

				
				callbackParams.groups.push({
					confirmCode: callbackParams.confirmCode,
					groupId: callbackParams.groupId
				});

				if (callbackParams.secret) {
					callbackParams.groups[callbackParams.groups.length - 1].secret = callbackParams.secret;
				}

			}

			if (callbackParams.groups.length === 0) {
				return reject(new Error("Select a group for listen calls"));
			} else {

				let gr_temp = {};

				callbackParams.groups.forEach((elem, index) => {
					let group = callbackParams.groups[index];

					if (!staticMethods.isObject(group)) {
						return reject(new Error(`Group settings is not an object (in ${index} index)`));
					}

					if (!group.groupId) {
						return reject(new Error(`Group id must be (groupId in ${index} index)`));
					}

					if (!group.confirmCode) {
						return reject(new Error(`Confirmation code must be (confirmCode in ${index} index)`));
					} else {
						gr_temp[group.groupId.toString()] = group;
					}

				});

				callbackParams.groups = gr_temp;

			}

			let cbserver = new CallbackAPI(self._vk);

			cbserver.__initApp(callbackParams).then((app) => {
				
				return resolve({
					connection: cbserver,
					web: app,
					vk: self._vk
				});

			});

		});
	}
}

module.exports = CallbackAPIConnector;