var request = require('request');


class LongPollConnection {
	constructor(vk) {
		this._server = vk.longpoll_server;
		this._ts = vk.longpoll_ts;
		this._key = vk.longpoll_key;
		this._vk = vk;
		this.listeners = {};
		this.listen();

		this.eventTypes = {
			4: 'message',
			8: 'friendOnline',
			9: 'friendOffline',
			51: 'editChat',
			61: 'typeInDialog',
			62: 'typeInChat',
		};
	}
	
	/**
	 *
	 *	This function create a listener (callback) for eventType
	 *	If vk.com return an updates array and my sdk have this event in eventTypes object, you can listen it with yours handlers
	 *	Example:
	 *		vk.com returned me that user Kirill sended message to user Maksim
	 *		and you can listen it
	 *		.on('message', function(msg){console.log(msg)});
	 *	Ok?
	 *
	 *	@param {String} eventType name of event, supported events you can see on github page
	 *	@param {Function} callback callback-function which get an answer from vk.com
	 *
	 */

	on (eventType, callback) {
		var self = this;
		if (Object.prototype.toString.call(callback) == "[object Function]") {
			self.listeners[String(eventType)] = callback;
		} else {
			throw "Why are you put to listener not a function?! Why???";
		}
	}


	/**
	 *	
	 *	This function calls to listener which you created with .on or .addEventCodeListener functions
	 *	I.e if you create csllback function with .on method, this function call to she!
	 *	.on('message', function(data){console.og(data)}); //Hello, world
	 *	.emit('message', 'Hello, world!');
	 *
	 *	@param {String} eventType name of event, supported events you can see on github page
	 *	@param {Any} data
	 *
	 */


	emit(eventType, data) {
		var self = this;

		if (self.listeners[eventType]) {
			try {
				self.listeners[eventType].call(self, data);
			} catch (e) {
				throw e;
			}
		}
	}

	//Only for me
	check_updates(updates) {
		var self = this;
		if (Array.isArray(updates)) {
			
			for (var updateIndex = 0; updateIndex < updates.length; updateIndex++) {
				var typeEvent = updates[updateIndex][0];
				var typeEventINT = updates[updateIndex][0];
				if (self.eventTypes[typeEvent]) {
					typeEvent = self.eventTypes[typeEvent];
					try {
						if (self[typeEvent + '__handler']) {
							self[typeEvent + '__handler'](updates[updateIndex]);
						} else if (self.listeners[typeEventINT]) {
							self.listeners[typeEventINT](updates[updateIndex]);
						}
					} catch (e) {
						console.log(e);
					}
				}
			}

		} else {
			return "Is not array!";
		}
	}

	//My handler, you can create yours!
	message__handler(msg) {
		var self = this;
		self._vk.call('messages.getById', {
			message_ids: msg[1],
		}).then(function(vkr){
			var msg_r = (vkr['response'][1] || vkr['response']['items'][0]);
			msg_r['flags'] = msg[2];
			self.emit('message', msg_r);
		}, function(err){
			console.log(err);
		});
	
	}

	//My handler, you can create yours!
	typeInDialog__handler(msg) {
		var self = this;
	
		self.emit('typeInDialog', {
			user_id: msg[1],
			flags: msg[2],
		});
	
	}

	//My handler, you can create yours!
	typeInChat__handler(msg) {
		var self = this;

		self.emit('typeInChat', {
			user_id: msg[1],
			chat_id: msg[2],
		});
	
	}

	//My handler, you can create yours!
	editChat__handler(msg) {
		var self = this;
	
		self.emit('editChat', {
			chat_id: msg[1],
			self: msg[2]
		});
	
	}
	
	//My handler, you can create yours!
	friendOnline__handler(msg) {
		var self = this;
		var platform = self._vk.platformById(msg[2] % 256);
		
		self.emit('friendOnline', {
			user_id: msg[1],
			extra: msg[2],
			timestamp: msg[3],
			platform: platform,
		});
	
	}

	//My handler, you can create yours!
	friendOffline__handler(msg) {
		var self = this;
		var platform = self._vk.platformById(msg[2] % 256);
		
		self.emit('friendOffline', {
			user_id: msg[1],
			extra: msg[2],
			timestamp: msg[3],
			platform: platform,
		});

	}

	//This method start listen a long-poll server and do some actions
	listen() {
		var self = this;
		var server = self._vk.PROTOCOL + "://" + self._server + "?";
		var params = {
			wait: "15",
			version: "2",
			act: "a_check",
			ts: self._ts,
			key: self._key,
			mode: (128 + 32 + 2),
		};
		params = self._vk.urlencode(params);
		self._lpconnection = request.get(server + params, function(err, res){
			if (err) {
				self.emit('error', err);
			} else {
				try {
					var vkr = res.body;
					vkr = JSON.parse(vkr);
					if (vkr['failed']) {
						self.emit('failure', vkr);
					} else {
						
						if (vkr['ts']) {
							self._ts = vkr['ts'];
						}
					
						if (vkr['updates']) {
							if (vkr['updates'].length > 0) {
								self.check_updates.call(self, vkr['updates']);
							}
						}
												
						self.listen();
					}

				} catch (e) {
					self.emit('error', e);
				}
			}
		});
	}


	close () {
		var self = this;
		

		return new Promise (function(resolve, reject){
			if (self._lpconnection) {

				self.emit('close', {
					time: new Date().getTime(),
				});

				resolve(self._lpconnection.abort());
			} else {
				reject("Longpoll not initialized !!");
			}
		});
	}

	/*
		
		So hhaaaard!!!
		Sorry for my english, it was hard for me, describe this function.
		
		If you want to create yours handlers or rewrite my handlers (why?) 
		you can do this with this method.
		
		Docs: vk.com/dev/using_longpoll

		So, for example: 
			My SDK don't support 70 event(calls) (why? Because vk.com no longer support this for users)
			And you want to listen it (what for?)
			You can do this!
			just...
			.addEventType(70, 'calls', function(data){
				console.log(this);
			});
			..and then you can do this
			.on('calls', function(){
	
			})

			.addEventType... function(data) and .on... function(msg) Is different functions! Do not confuse!
	*/

	/**
	 *
	 *	@param {Number} eventCode this is eventCode from docs page
	 *	@param {String} eventType you can create name for your event
	 *	@param {Function} handler is handler-function (not callback)
	 *	@param {Boolean} rewrite if you want rewrire my handlers and get clean information from vk.com you can do this,
	 *	just put for example 4, 'message', function(msg){ }, true in paramaters
	 *
	 */

	addEventType(eventCode, eventType, handler, rewrite=false) { //For dev and extend modules
		var self = this;
		return new Promise(function(resolve, reject) {
			if (eventCode && eventType && handler) {
				if (self.eventTypes[eventCode] && rewrite) {
					
					self.eventTypes[eventCode] = eventType;
					self[eventType + "__handler"] = handler;

				} else {
					reject("If you want rewrite handler then set rewrite parameter true! (see code on github)");
				}
			} else {
				reject("Please, enter eventCode, eventType and handler function!!!!");
			}
		});
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


	addEventCodeListener(eventCode, handler) { //Only for create new event listeneres (if there are not in default listeners, you can get a code and add it!)
		var self = this;
		return new Promise(function(resolve, reject){
			if (eventCode && handler) {
				if (!self.eventTypes[eventCode]) {
					var prefix = eventCode.toString();
					if (!self.listeners[prefix]) {						
						self.eventTypes[eventCode] = prefix;
						self.listeners[prefix] = handler;
					} else {
						reject("This callback already have!");
					}
				} else {
					reject("This eventCode already have!");
				}
			}
		});
	}
}


module.exports = LongPollConnection;
