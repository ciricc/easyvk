
/*
 *  This is a LongPoll Object for Bots (groups longpoll).
 *  Here you can create your bots and listen group events
 *
 */

"use strict";

const request = require("request");
const staticMethods = require("./staticMethods.js");
const EventEmitter = require("events");



// LongPollConnection is inited automatically by me
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
				timeout: (_w * 1000) + (1000 * 3) // 3+ seconds wait time
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

					if (self._vk.debugger) {
						try {
							self._vk.debugger.push("response", res.body);
						} catch (e) {
							// Ignore
						}
					}
					
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
						// Ok
						if (vkr.failed) {

							if (vkr.failed === 1) { // update ts
								
								if (vkr.ts) {
									self.config.longpollTs = vkr.ts;
								}

								init();

							} else if ([2,3].indexOf(vkr.failed) != -1){ // reconnect needed
								
								self._vk.call("messages.getLongPollServer", self.config.userConfig.forGetLongPollServer).then(({vkr}) => {
									
									self.config.longpollServer = vkr.response.server;
									self.config.longpollTs = vkr.response.ts;
									self.config.longpollKey =  vkr.response.key;
									
									init(); // reconnecting with new parameters

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
			
			return "Yeah, that's not an array";
		}

	}
	
	/*
	 *  This function closes the connection and stops it
	 *  
	 *  @return {Promise}
	 *  @promise Close connection
	 *  @resolve {*} response from the abort() method
	 *  @rejet {Error} - Error if connection failed to initiate
	 * 
	 */

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

	/*
	 *  This function enables (adds) your debugger for each query
	 *  For example: you can see an error if it occures and log it with the debugger function
	 * 
	 *  @param {Function|Async Function} [debugg] - Function for debugging all queries
	 *  This function will be executed for all the responses from vk, you can log this object to know more
	 *  
	 *  @return {Boolean|Object} - If your function is not a function (why would you do this?), then false will be returned,
	 *  else LongPollConnection object will be returned
	 * 
	 */

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

	// Constructed from EasyVK
	constructor (vk) {
		let self = this; // For the future
		self._vk = vk;
	}

	/*
	 *
	 *  This function creates a LongPollConnection and then constantly re-calls to the server for
	 *  new events
	 *  
	 *  @param {Object} [params] - Settings for the LongPoll connection
	 *  @param {Object} [params.forGetLongPollServer] - Only for the first query.
	 *  This parameter contains the connection uri. For more info: https://vk.com/dev/bots_longpoll
	 *  @param {Object} [params.forLongPollServer] - Parameters object (for each query)
	 *  For example: { "wait": 10 } // Waits 10 seconds before a new call
	 * 
	 *  @return {Promise}
	 *  @promise Connect to the longpoll server
	 *  @resolve {Object} - Object of this structure: 
	 *    { vk: EasyVK, connection: LongPollConnection }
	 *  @reject {Error} - vk.com error or just an error from request module
	 *
	 */

	async connect (params = {}) {
		let self = this;
		return new Promise ((resolve, reject) => {
			
			if (!staticMethods.isObject(params)) {
				reject(new Error("LongPoll parameters must be an object!"));
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
