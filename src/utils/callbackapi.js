/*
 *  - Knock knock?
 *  - Who's there?
 *  - It's the Callback API module for EasyVK!
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
				
				if (group.secret) { // If you use a password (secret key)
					
					if (postData.secret && postData.secret.toString() === group.secret.toString()) {                                                                            
						res.status(200).send(group.confirmCode);
					} else {
						
						res.status(400).send("secret error");
						self.emit("secretError", {
							postData: postData,
							description: "Whoops, you don't have a secret key! If you want to add one, go to your group settings!"
						});

					}

				} else {
					res.status(200).send(group.confirmCode);
				}

			} else {
				
				res.status(400).send("group doesn't exist");
				self.emit("confirmationError", {
					postData: postData,
					description: "There is no group with this groupId"
				});

			}

		} else if (postData.type !== "confirmation" ){
			
			if (group) {
				
				if (group.secret) {
					
					if (postData.secret && postData.secret.toString() !== group.secret.toString()) {
						
						res.status(400).send("secret error");
						self.emit("secretError", {
							postData: postData,
							description: "Secret key in the request and in your settings are not the same"
						});
						
						return;

					} else if (!postData.secret) {
						
						res.status(400).send("secret error");
						self.emit("secretError", {
							postData: postData,
							description: "Your group settings are set to use the secret key, but you don't have one in the request"
						});
						
						return;

					}
				}

				if (postData.type) {
					
					self.emit(postData.type, postData);
					res.status(200).send("ok");

				} else {
					
					res.status(400).send("invalid event type");
					self.emit("eventEmpty", {
						postData: postData,
						description: "This request doesn't have the event type. Event name is empty"
					});

				}

			} else {
				
				res.status(400).send("group doesn't exist");
				self.emit("confirmationError", {
					postData: postData,
					description: "There is no group with this groupId"
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
			if (self._app) { // One time only
				return reject(new Error("You are already listening the server!"));	
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
	
	// Auto constructed by EasyVK
	constructor (vk) {
		let self = this;
		self._vk = vk;
	}


	/*
	 *  This function sets up a server to listen to group events
	 *
	 *  @param {Object} callbackParams - Yo, params here
	 *  @param {Object[]} [callbackParams.groups] - Array of groups to listen to
	 *  @param {String|Number} [callbackParams.groupId] - Group id to listen to, if callbackParams.groups[] are specified, this one is added to the array
	 *  You need to select at least one group
	 *  @param {String|Number} [callbackParams.confirmCode] - Your confirmation code. This code will be sended to confirm the query
	 *  @param {String|Number} [callbackParams.secret] - Your secret code for one group, I am recommend you to use it for secure
	 *  @param {String|Number} [callbackParams.port=(process.env.PORT || 3000)] - Port for the http server, default is process.env.PORT || 3000
	 *  
	 *  If you listen to many groups, you need to separate (spread) groupId, secret and confirmCode parameters to objects in array
	 *  like { groups: [{groupId: ..., secret: ..., confirmCode: ...}, ...] }
	 * 
	 *  @return {Promise}
	 *  @promise Turns on your server... Err, I mean starts a server
	 *  @resolve {Object} - Object of this structure:
	 *  {vk: EasyVK, connection: CallbackAPI, web: expressApplication}
	 *  @reject {Error} - Error, error, error
	 * 
	 */



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


			if (callbackParams.groupId) { // If only one groupId is specified
				
				if (!callbackParams.confirmCode) {
					return reject(new Error("Where's the confirmation code, dude? Go get one"));
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
				return reject(new Error("Select a group to listen to"));
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
