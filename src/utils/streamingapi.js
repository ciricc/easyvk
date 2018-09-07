
/**
 *  Added support Streaming API, module for EasyVK.
 *  You can use it for listen and collect data from vk, create metrics and other...
 *  
 *  Author: @ciricc
 *  License: MIT
 *
 */

"use strict";

const request = require("request");
const staticMethods = require("./staticMethods.js");
const EventEmitter = require("events");
const configuration = require("./configuration.js");
const WS = require("ws");

class StreamingAPIConnection extends EventEmitter {
	
	constructor(vk, session, wsc) {
		
		super();
		
		let self = this;
		
		self._vk = vk;
		self._session = session;
		self._wsc = wsc;
		self._urlHttp = `${configuration.PROTOCOL}://${self._session.server.endpoint}`;
		self._key = self._session.server.key;
		self.__initWebSocket();

	}

	__initWebSocket () {
		
		let self = this;

		self._wsc.on("error", (error) => {
		    self.emit("error", new Error(error.toString()));
		});

		self._wsc.on("message", (message) => {
			self.__initMessage(message);
		});

	    self._wsc.on("close", (r) => {
			self.emit("failure", `Connection closed ${(r) ? '(' + r + ')' : ''}`);
		});

	}

	__initMessage (msgBody) {
		var self = this;

		try {
			let body = JSON.parse(msgBody);

			if (parseInt(body.code) === 100) {

				if (self.listeners(body.event.event_type).length) {
					self.emit(body.event.event_type, body.event);
				} else {
					self.emit("pullEvent", body.event);
				}

			} else if (body.code == 300) {
				self.emit('serviceMessage', body.service_message);
			}

		} catch (e) {
			self.emit('error', e);
		}

	}

	async close () {
		let self = this;
		
		return  new Promise((resolve, reject) => {
			
			if (self._wsc) {
				
				return resolve({
					response: self._wsc.close(),
					vk: self._vk
				});

			} else {
				return reject(new Error("WebSocket not connected"));
			}

		});
	}

	async __MRHTTPURL (method, json) {
		let self = this;

		return new Promise ((resolve, reject) => {
			method = method.toString().toLocaleLowerCase();
			
			if (request.hasOwnProperty(method)) {
				
				let queryParams = {
					method: method.toLocaleUpperCase(),
					uri: `${self._urlHttp}/rules?key=${self._key}`,
					json: json
				}


				request[method](queryParams, (err, res) => {
					if (err) {
						return reject(new Error(err));
					}

					let vkr = res.body;
					
					if (self._vk.debugger) {
						try {
							self._vk.debugger.push("response", vkr);
						} catch (e) {
							//Ignore
						}
					}

					if (vkr) {

						if (staticMethods.isObject(vkr)) {
							vkr = JSON.stringify(vkr);
						}

						let json = staticMethods.checkJSONErrors(vkr, reject);
						
						if (json) {
							return resolve(json);
						} else {
							return reject(new Error("JSON is not valid... oor i don't know"));
						}

					} else {
						reject(new Error(`Empty response ${vkr}`));
					}

				});

			} else {
				return reject(new Error("Undefined method type"));
			}

		});

	}

	async addRule (tag, rule) {
		let self = this;
		return new Promise((resolve, reject) => {
			
			let MRHTTPParams = {
				"rule": {
					"value": rule,
					"tag": tag
				}
			}

			self.__MRHTTPURL("POST", MRHTTPParams).then((d) => {
				
				return resolve({
					vkr: d,
					vk: self._vk
				});

			}, reject);

		});
	}

	async deleteRule (tag) {
		let self = this;
		return new Promise((resolve, reject) => {
			
			let MRHTTPParams = {
				"tag": tag
			}

			self.__MRHTTPURL("DELETE", MRHTTPParams).then((d) => {
				
				return resolve({
					vkr: d,
					vk: self._vk
				});

			}, reject);

		});
	}

	async getRules () {
		let self = this;
		return new Promise ((resolve, reject) => {
			self.__MRHTTPURL("GET", {}).then((rules) => {
				
				return resolve({
					vk: self._vk,
					vkr: rules
				})

			}, reject);
		});
	}

	async deleteAllRules () {
		let self = this;

		return new Promise((resolve, reject) => {
			//For begin - get All rules
			self.getRules().then(({vkr: rules}) => {
				rules = rules.rules;
				let i = 0;
				
				function del () {
					
					if (i === rules.length) {
						return resolve({code:200, vk: self._vk});
					}

					let rule = rules[i];
					
					self.deleteRule(rule.tag).then(() => {
						
						i++;
						
						setTimeout(() => {
							del();
						}, 600);

					}, reject);

				}
				
				if (rules) {
					del();
				} else {
					return resolve({code:200, vk: self._vk});
				}

			}, reject);
		});
	}

	async initRules (rulesObject = {}, callBackError) {
		let self = this;

		return new Promise((resolve, reject) => {
			
			if (!staticMethods.isObject(rulesObject)) {
				return reject(new Error("rules must be an object"));
			}

			if (callBackError) {

				if (Object.prototype.toString.call(callBackError) !== "[object Function]") {
					return reject(new Error("callBackError must be function"));
				}

			} else {
				callBackError = function (err) {}
			}



			//For begin get all rules and then change/add/delete rules
			self.getRules().then(({vkr: startedRules}) => {

				let changedRules, stRulesObject, tags, addedRules, deletedRules;

				startedRules = startedRules.rules;
				
				if (!startedRules) {
					startedRules = [];
				}


				changedRules = [], addedRules = [], deletedRules = [];
				stRulesObject = {};
				tags = [];

				for (let l = 0; l < startedRules.length; l++) {
					let rule = startedRules[l];
					stRulesObject[rule.tag] = rule.value;
				}

				for (let tag in rulesObject) {
					tags.push(tag);
				}


				let iN, i;

				iN = 0;
				i = 0;
	
				function next () {
					
					i++;
					
					setTimeout(() => {
						initRule();
					}, 400);

				}

				function initRule() {
					
					if (i >= startedRules.length) {
						return initAddRule();
					}


					let rule = startedRules[i];


					if (rulesObject[rule.tag]) { //Change rule
						if (rule.value === rulesObject[rule.tag]) { //No need change
							next();
						} else {
							//Need change it. Delete and it and then add
							self.deleteRule(rule.tag).then(() => {
								//Add again

								self.addRule(rule.tag, rulesObject[rule.tag]).then(() => {
								
									//Success changed
									changedRules.push({
										tag: rule.tag,
										lastValue: rule.value,
										newValue: rulesObject[rule.tag]
									});

									next();

								}, (err) => {
									
									callBackError({
										where: "add changes",
										rule: rule,
										from: "user_rules",
										description: "Occured error in add method when we tried add rule which was changed",
										error: err
									});

									next();

								});

							}, (err) => {
								
								callBackError({
									where: "delete changes",
									rule: rule,
									from: "vk_rules",
									description: "Occured error in delete method when we tried delete rule which was changed",
									error: err
								});

								next();

							});
						}
					} else { //Delete rule
						self.deleteRule(rule.tag).then(()=>{
							
							//Success deleted
							deletedRules.push({
								tag: rule.tag,
								value: rule.value
							});
							
							next();

						}, (err) => {
							
							callBackError({
								where: "delete",
								rule: rule,
								from: "vk_rules",
								description: "Occured error in delete method when we tried delete rule which not declared in init object",
								error: err
							});
							
							next();

						});
					}
				}

				initRule();

	
				function nextAdd() {
					
					iN++;
					
					setTimeout(() => {
						initAddRule();
					}, 400);

				}

				function initAddRule () {
					
					if (iN >= tags.length) {
						return resolve({
							log: {
								changedRules: changedRules,
								addedRules: addedRules,
								deletedRules: deletedRules
							},
							vk: self._vk
						});
					}
				
					let rule = tags[iN];

					if (!stRulesObject.hasOwnProperty(tags[iN])) { //Need add new rules
						self.addRule(tags[iN], rulesObject[tags[iN]]).then(() => {
							
							//Success add
							addedRules.push({
								tag: tags[iN],
								value: rulesObject[tags[iN]]
							});
							
							nextAdd();

						}, (err) => {
							
							callBackError({
								where: "add",
								rule: rule,
								from: "user_rules",
								description: "Occured error in add method when we tried add rule which not declared in vk rules",
								error: err
							});
							
							nextAdd();

						});

					} else {
						nextAdd();
					}
				}

			}, reject);

		});
	}
}

class StreamingAPIConnector {

	constructor (vk) {
		let self = this;
		self._vk = vk;
	}

	async connect (applicationParams = {}) {
		let self = this;

		return new Promise((resolve, reject) => {

			if (applicationParams) {

				if (!staticMethods.isObject(applicationParams)) {
					return reject(new Error("application params must be an objct parameter"));
				}

			}

			if (applicationParams.clientId && applicationParams.clientSecret) {
				
				let getParams = {
					client_id: applicationParams.clientId,
					client_secret: applicationParams.clientSecret, 
					v: self.api_v,
					grant_type: "client_credentials",
				};

				getParams = staticMethods.urlencode(getParams);

				request.get(`${configuration.BASE_OAUTH_URL}access_token?${getParams}`, (err, res) => {
					
					if (err) {
						return reject(new Error(err));
					}

					let vkr = res.body;
					if(self._vk.debugger) {
						try {
							self._vk.debugger.push("response", vkr);
						} catch (e) {
							//Ignore
						}
					}
					
					if (vkr) {
						let json = staticMethods.checkJSONErrors(vkr, reject);
						
						if (json) {

							staticMethods.call("streaming.getServerUrl", {
								access_token: json.access_token
							}).then((vkrURL) => {
								let streamingSession, wsc;

								streamingSession = {
									server: vkrURL,
									client: json
								}

								wsc = new WS(`wss://${streamingSession.server.endpoint}/stream?key=${streamingSession.server.key}`);
								
								wsc.on("open", () => {
									
									let _StreamingAPIConnecton = 
									new StreamingAPIConnection(self._vk, streamingSession, wsc);
									
									return resolve({
										connection: _StreamingAPIConnecton,
										vk: self._vk
									});

								});


							}, reject);

						} else {
							return reject(new Error("JSON is not valid... oor i don't know"));
						}

					} else {
						return reject(new Error(`Empty response ${vkr}`));
					}

				});

			} else {
				return reject(new Error("clientId and clientSecret not declared"));
			}
		});
	}
}

module.exports = StreamingAPIConnector;