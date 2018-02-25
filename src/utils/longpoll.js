"use strict";

const request = require("request");
const staticMethods = require("./staticMethods.js");
const EventEmitter = require('events');

class LongPollConnection extends EventEmitter { 
	constructor (lpSettings, vk) {
		super();
		let self = this;

		self.config = lpSettings;
		self._vk = vk;
		self.userListeners = {};
		
		self.supportEventTypes = {
			"4": "message",
			"8": "friendOnline",
			"9": "friendOffline",
			"51": "editChat",
			"61": "typeInDialog",
			"62": "typeInChat",
		};

		init();

		function init () {

			let server = `${self._vk.config.PROTOCOL}://${self.config.longpollServer}?`;
			let forLongPollServer = {};
			
			forLongPollServer.act = "a_check";
			forLongPollServer.key = self.config.longpollKey;
			forLongPollServer.ts = self.config.longpollTs;
			forLongPollServer.mode = self.config.userConfig.forLongPollServer.mode;
			forLongPollServer.version = self.config.userConfig.forLongPollServer.version;

			if (isNaN(forLongPollServer.mode)) forLongPollServer.mode = (128 + 32 + 2);
			if (isNaN(forLongPollServer.version)) forLongPollServer.version = "2";

			forLongPollServer = staticMethods.urlencode(forLongPollServer);

			self.lpConnection = request.get(server + forLongPollServer, (err, res) => {
				if (err) {
					self.emit("error", err);
				} else {
					let vkr = staticMethods.checkJSONErrors(res.body, (vkrError) => {
						self.emit("error", vkrError);
					});

					if (vkr) {
						//Ok
						if (vkr.failed) {
							self.emit("failure", vkr);
						} else {
							if (vkr.ts) self.config.longpollTs = vkr.ts;
							
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
				let typeEvent = updates[updateIndex][0].toString();
				if (self.supportEventTypes[typeEvent]) {
					typeEvent = self.supportEventTypes[typeEvent];
					try {
						if (self.userListeners[typeEvent]) {
							self.userListeners[typeEvent](updates[updateIndex]);
						} else {
							self.emit(typeEvent, updates[updateIndex]);
						}
					} catch (e) {
						self.emit("error", e);
					}
				}
			}
		} else {
			return "Is not array!";
		}
	}

	/**
	 *
	 *	If my SDK not support certain event it doesn't mean that my SDK not support it :D
	 *	You can add yours listeners with this function.
	 *	
	 *	Docs: vk.com/dev/using_longpoll
	 *
	 *	@param {Number} eventCode number of event which you can find on the docs page
	 *	@param {Function} handler is a handler function
	 *
	 */


	async addEventCodeListener (eventCode, handler) { //Only for create new event listeneres (if there are not in default listeners, you can get a code and add it!)
		let self = this;
		return new Promise((resolve, reject) => {
			if (isNaN(eventCode)) reject(new Error("eventCode must be numeric"));
			else if (Object.prototype.toString.call(handler) !== "[object Function]") reject(new Error("callback function must be function"));
			else {
				eventCode = eventCode.toString();
				if (!self.eventTypes[eventCode]) {
					self.supportEventTypes[eventCode] = eventCode;
					self.userListeners[eventCode] = handler;
				} else {
					reject(new Error("This eventCode already have"));
				}
			}
		});
	}
}

class LongPollConnector {

	constructor (vk) {
		let self = this; //For the future
		self._vk = vk;
	}

	/*
	 * wdwd
	 */

	async connect (params = {}) {
		let self = this;
		return new Promise ((resolve, reject) => {
			if (!staticMethods.isObject(params)) reject(new Error("LongPoll parameters mast be an object!"));
			else {
				
				if (params.forGetLongPollServer) {
					if (!staticMethods.isObject(params.forGetLongPollServer)) params.forGetLongPollServer = {};
				} else params.forGetLongPollServer = {};

				if (params.forLongPollServer) {
					if (!staticMethods.isObject(params.forLongPollServer)) params.forLongPollServer = {};
				} else params.forLongPollServer = {};

				if (isNaN(params.forGetLongPollServer)) {
					params.forGetLongPollServer.lp_version = "2";
				}

				self._vk.call("messages.getLongPollServer", params.forGetLongPollServer).then((vkr) => {
					let forLongPoll = {
						longpollServer: vkr.response.server,
						longpollTs: vkr.response.ts,
						longpollKey: vkr.response.key,
						userConfig: params
					};
					resolve(new LongPollConnection(forLongPoll, self._vk));
				}, reject);

			}
		});
	}
}

module.exports = LongPollConnector;