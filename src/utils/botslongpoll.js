"use strict";

const request = require("request");
const staticMethods = require("./staticMethods.js");
const EventEmitter = require("events");

class LongPollConnection extends EventEmitter { 
	constructor (lpSettings, vk) {
		super();
		let self = this;

		self.config = lpSettings;
		self._vk = vk;
		self.userListeners = {};

		init();

		function init () {

			let server, forLongPollServer, _w;

			server = `${self.config.longpollServer}?`;
			forLongPollServer = {};
			_w = null;

			forLongPollServer.act = "a_check";
			forLongPollServer.key = self.config.longpollKey;
			forLongPollServer.ts = self.config.longpollTs;
			forLongPollServer.version = self.config.userConfig.forLongPollServer.version;
			forLongPollServer.wait = self.config.userConfig.forLongPollServer.wait;

			if (isNaN(forLongPollServer.version)) {
				forLongPollServer.version = "2";
			}

			_w = forLongPollServer.wait;

			forLongPollServer = staticMethods.urlencode(forLongPollServer);
			
			let params = {
				url: server + forLongPollServer, 
				timeout: (_w * 1000) + (1000 * 3) //3 seconds plus wait time
			}

			if (self._debug) {
				
				self._debug({
					type: "longPollParamsQuery",
					data: params
				});

			}


			self.lpConnection = request.get(params, (err, res) => {

				if (err) {
					self.emit("error", err);
				} else {

					self._vk.debugger.push("response", res.body);
					
					if (self._debug) {
						
						self._debug({
							type: "pollResponse",
							data: res.body
						});

					}

					let vkr = staticMethods.checkJSONErrors(res.body, (vkrError) => {
						self.emit("error", vkrError);
					});

					if (vkr) {
						//Ok
						if (vkr.failed) {

							if (vkr.failed === 1) { //update ts
								
								if (vkr.ts) {
									self.config.longpollTs = vkr.ts;
								}

								init();

							} else if ([2,3].indexOf(vkr.failed) != -1){ //need reconnect
								
								self._vk.call("messages.getLongPollServer", self.config.userConfig.forGetLongPollServer).then(({vkr}) => {
									
									self.config.longpollServer = vkr.response.server;
									self.config.longpollTs = vkr.response.ts;
									self.config.longpollKey =  vkr.response.key;
									
									init(); //reconnect with new parameters

								}).catch((err) => {
									self.emit("reconnectError", new Error(err));
								});

							} else {
								self.emit("failure", vkr);
							}
						} else {

							if (vkr.ts) {
								self.config.longpollTs = vkr.ts;
							}
							
							if (vkr.updates) {
								
								if (vkr.updates.length > 0) {
									self._checkUpdates(vkr.updates);
								}

							}	

							init();

						}

					}

				}

			});

		}

	}

	_checkUpdates(updates) {
		let self = this;

		if (Array.isArray(updates)) {
			
			for (let updateIndex = 0; updateIndex < updates.length; updateIndex++) {
				
				let typeEvent = updates[updateIndex].type.toString();
				
				self.emit(typeEvent, updates[updateIndex].object);

			}

		} else {
			
			return "Is not array!";
		}

	}
	
	async close () {
		let self = this;
		
		return new Promise ((resolve, reject) => {
			
			if (self.lpConnection) {
				
				self.emit("close", {
					time: new Date().getTime(),
				});
				
				return resolve(self.lpConnection.abort());

			} else {
				return reject(new Error("LongPoll not connected"));
			}

		});

	}

	debug (debugg) {
		let self = this;

		if (Object.prototype.toString.call(debugg).match(/function/i)) {
			self._debug = debugg;
		} else {
			return false;
		}

		return self;
	}
}

class LongPollConnector {

	constructor (vk) {
		let self = this; //For the future
		self._vk = vk;
	}

	async connect (params = {}) {
		let self = this;
		return new Promise ((resolve, reject) => {
			
			if (!staticMethods.isObject(params)) {
				reject(new Error("LongPoll parameters mast be an object!"));
			} else {
				
				if (params.forGetLongPollServer) {
					
					if (!staticMethods.isObject(params.forGetLongPollServer)) {
						params.forGetLongPollServer = {};
					}

				} else {
					params.forGetLongPollServer = {};
				}


				if (params.forLongPollServer) {
					
					if (!staticMethods.isObject(params.forLongPollServer)) {
						params.forLongPollServer = {};
					}

				} else {
					params.forLongPollServer = {};
				}


				if (isNaN(params.forGetLongPollServer.lp_version)) {
					params.forGetLongPollServer.lp_version = "2";
				}

				if (isNaN(params.forLongPollServer.wait)) {
					params.forLongPollServer.wait = "25";
				}


				self._vk.call("groups.getLongPollServer", params.forGetLongPollServer).then(({vkr}) => {
					
					let forLongPoll = {
						longpollServer: vkr.response.server,
						longpollTs: vkr.response.ts,
						longpollKey: vkr.response.key,
						responseGetServer: vkr,
						userConfig: params
					};

					return resolve({
						connection: new LongPollConnection(forLongPoll, self._vk),
						vk: self._vk
					});

				}, reject);


			}

		});

	}
	
}

module.exports = LongPollConnector;