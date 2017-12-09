var request = require('request'); 
var fs = require('fs');
class VK {
	constructor() {
		// super();

		this.PROTOCOL = "https"; //Standart protocol, vk.com demand it is this protocol fro communicate
		this.BASE_DOMAIN = "vk.com";
		this.BASE_CALL_URL = this.PROTOCOL + "://" + "api." + this.BASE_DOMAIN + "/method/";
		this.BASE_OAUTH_URL = this.PROTOCOL + "://" + "oauth." + this.BASE_DOMAIN + "/";
		this.MAX_SCOPE = "notify,friends,photos,audio,video,pages,status,notes,messages,wall,offline,docs,groups,notifications,stats,email,market"; //This is max scope and permissions FOR STAND-ALONE APP!!!
		this.WINDOWS_CLIENT_ID = "2274003"; //If you will use password and username, sdk login width this parameters by oauth.vk.com
		this.WINDOWS_CLIENT_SECRET = "hHbZxrka2uZ6jB1inYsH"; //And this
		this.session_file = ".vksession"; //File, which that stores itself json-session
		this.session = {};

		this.v = "0.0.1";

	}

	/*

		Authorization and session creation function.
		Used to create a session for an application for windows.

		@param username_arg [string / object]: if you put username_arg as {} then all arguments will be use from it
		else it is just a username string (email, phone and what else?)
		@param password_arg [string]: if you puted an username_arg as a string then you must put this parameter
		@param captcha_sid_arg [number / string]: if you got an error from last query, you must put a captcha_sid from error info and captcha_key (just a text on image) parameter
		@param captcha_key [string]: text on captcha
		
		@returns Promise
	*/

	login (username_arg, password_arg, captcha_sid_arg, captcha_key_arg, reauth_arg) {
		var self = this;
		var username, password, access_token, captcha_sid, captcha_key, scope, save_session, reauth, username;

		return new Promise(function(resolve, reject){
			
			if (Object.prototype.toString.call(username_arg) == "[object String]") {
				if (Object.prototype.toString.call(password_arg) == "[object String]") {
					username = username_arg;
					password = password_arg;
					captcha_sid = captcha_sid_arg;
					captcha_key = captcha_key_arg;
					reauth = reauth_arg;
				} else {
					reject("Please, if you enter a string login then enter a pass string too");
				}
			} else {
				if (!username_arg) username_arg = {}

				var p = username_arg;
				password = p.password;
				access_token = p.access_token;
				captcha_sid = p.captcha_sid;
				captcha_key = p.captcha_key;
				scope = p.scope;
				save_session = p.save_session;
				reauth = p.reauth;
				username = p.username;

				if (p.session_file) {
					self.session_file = p.session_file;
				}

			}

			if (!captcha_sid) captcha_sid = "";
			if (!scope) scope = self.MAX_SCOPE;
			if (save_session != false || save_session != 0) save_session = true;
			if (reauth != true || reauth != 1) reauth = false;

			if (captcha_sid) self.session['captcha_sid'] = captcha_sid;
			if (captcha_key) self.session['captcha_key'] = captcha_key;

			if (username &&  password && access_token) {
				reject("Please, enter only access_token or only password with username. Not all together!");	
			}

			if ((username && password && !access_token) || (!password && !username && !access_token)) {
				var not_finded_session = false;
				if (!reauth) {
					fs.readFile(self.session_file, function(err, session_json){
						if (err) {
							reject(err);
						} else {
							try {
								session_json = JSON.parse(session_json);
								if (session_json['access_token']) {
									self.session = session_json;
									resolve(self.session);
								} else {
									reject("Undefined access_token in file session!");
								}

							} catch (e) {
								if (session_json.length == 0) {
									reject("Session file is empty! Please, enter username and password or only access_token fields!");
								} else {
									reject(e);
								}
							}
						}
					});
				}
				
				var params = {
					username: username,
					password: password,
					client_id: self.WINDOWS_CLIENT_ID,
					client_secret: self.WINDOWS_CLIENT_SECRET,
					captcha_sid: captcha_sid,
					captcha_key: captcha_key,
					grant_type: "password",
					scope: scope
				}
				
				params = self.urlencode(params);

				if (reauth || not_finded_session) {
					request.get(self.BASE_OAUTH_URL + "token/?" + params, function(err, res, vkr){
						if (err) {
							reject("Server was down or we don't know what happaned [responseCode " + res.statusCode + "]");
						}

						try {
							vkr = JSON.parse(vkr);
							var error = self.check_error(vkr);
							
							if (error) {
								reject(error);
							} else {
								
								if (save_session) {
									self.save_session();
								}

								self.session = vkr;
								resolve(self.session);
							}	

						} catch(e) {
							reject(e);
						}

					});
				}
			} else if (access_token && !password && !username) {
				//Reuth = false, try to auth and get session by token

				var params = {
					access_token: access_token
				}

				params = self.urlencode(params);

				request.get(self.BASE_CALL_URL + "users.get?" + params, function(err, res, vkr){
					if (err) {
						reject(err);
					} else {
						try {
							vkr = JSON.parse(vkr);
							var error = self.check_error(vkr);

							if (error) {
								reject(error);
							} else {
								vkr = vkr['response'][0];
								
								self.session['user_id'] = vkr['uid'];
								self.session['access_token'] = access_token;

								if (save_session) {
									self.save_session();
									resolve(self.session);
								}
							}
						} catch (e) {
							reject(e);
						}
					}
				});

			}

		});
	}

	/*
		
		Function for calling to methods and get anything
		Docs: vk.com/dev/methods

		@param method_name [string]: Is just a method name :D (messages.get/wall.edit an others)
		@param data [object]: If vk.com asks a paramaeters, you can do this. (You can not put access_token to this from session, but also you can it)
		
		@returns Promise

	*/

	call(method_name, data) {
		var self = this;

		return new Promise(function(resolve, reject){
			if (!method_name) reject("Undefined method!");
			if (!data) data = {};

			data['access_token'] = self.session['access_token'];
			
			if (self.session['captcha_sid']) data['captcha_sid'] = self.session['captcha_sid'];
			if (self.session['captcha_key']) data['captcha_key'] = self.session['captcha_key'];

			data = self.urlencode(data);

			request.get(self.BASE_CALL_URL + method_name + "?" + data, function(err, res, vkr){
				if (err) reject(err);
				try {
					vkr = JSON.parse(vkr);
					var error = self.check_error(vkr);
					if (error) {
						reject(error);
					} else {
						resolve(vkr);
					}

				} catch(e) {
					reject(e);
				}
			});
		});
	}

	/*
		
		This function get a server, ts and key parameters from vk.com for create a long-poll connection.

		@returns Promise

	*/


	longpoll() {
		var self = this;
		return new Promise(function(resolve, reject){
			if (!self.longpoll_server) {
				self.call('messages.getLongPollServer').then(function(vkr){
					self.longpoll_server = vkr['response']['server'];
					self.longpoll_ts = vkr['response']['ts'];
					self.longpoll_key = vkr['response']['key'];
					var longpoll_connection = new LongPollConnection(self);
					resolve.call(longpoll_connection, longpoll_connection);
				}, function(err){
					reject(err);
				});
			}
		});
	}

	/*
		
		If you need get platform by id, you can do this by this function
		
		Docs: https://vk.com/dev/using_longpoll_2?f=7.+Платформы
		@param platformID [number]: Is a platform_id, which you can find on docs-page

	*/


	platformById(platformID) {
		var platform = "web";
		if (platformID == 1) platform = "mobile";
		if (platformID == 2) platform = "iphone";
		if (platformID == 3) platform = "ipad";
		if (platformID == 4) platform = "android";
		if (platformID == 5) platform = "wphone";
		if (platformID == 6) platform = "windows";
		if (platformID == 7) platform = "web";
		return platform;
	}

	// Only for me, but you can use it if understand how

	check_error(rvk) {
		try {
			if (rvk['error']) {
				

				if (rvk['error'] == "need_captcha" || rvk['error']['error_code'] == 14) {
					return rvk;
				}

				if (rvk['error']['error_msg']) {
					return rvk['error']['error_msg'];
				} else {
					return rvk['error_description'];
				}
			}
		} catch (e) {
			return e;
		}
	}

	/*
	
		This function return a get url with parameters. If you want get url encoded string from object you can use it.

		@param object [object, it is clear, man!]: It just a object.................. :(
		
		@returns string

	*/

	urlencode(object = {}) {
		var parameters = "";
		
		for (let key in object) {
			if (parameters != "") {parameters += "&";}
			if (String(object[key]).match(/&/)) { //SOmetimes vk.com love push to response many parameters like: {key: "yourkey....&version=2"} ...
				var p = object[key].split("&");

				for (var i = 1; i < p.length; i++) {
					parameters += p[i] + "&";
				}
				object[key] = p[0];
			}

			var com = encodeURIComponent(object[key]);
			if (Array.isArray(object[key])) com.replace(/\[\]/g, "");
			parameters += key + "=" + com;
		}

		return parameters;
	}

	//Only for me, but you can use it
	save_session() {
		var self = this;

		if (self.session['access_token']) {
			fs.writeFile(self.session_file, JSON.stringify(self.session), function(error) {
				if (error) {
					return false;
				}
			});
		}
	}

	//No comments
	is_login() {
		var self = this;

		if (self.session['access_token']) {
			return true;
		}

		return false;
	}

	//Who can help me rewrite this method? (If it need)
	extend(objectKeys) { 
		for (var i in objectKeys) {
			this[i] = objectKeys[i];
		}
	}
}

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
			61: 'typeInDialog',
			62: 'typeInChat',
			8: 'friendOnline',
			9: 'friendOffline',
		};
	}
	
	/*

		This function create a listener (callback) for eventType
		If vk.com return an updates array and my sdk have this event in eventTypes object, you can listen it with yours handlers
		Example:
			vk.com returned for me that user Kirill puted message to user Maksim
			and you can listen it
			.on('message', function(msg){console.log(msg)});
		Ok?

		@param eventType [string]: name of event, supported events you can see on github page
		@param callback [function]: callback-frunction which get an answer from vk.com

	*/

	on (eventType, callback) {
		var self = this;
		if (Object.prototype.toString.call(callback) == "[object Function]") {
			self.listeners[String(eventType)] = callback;
		} else {
			throw "Why are you put to listener not a function?! Why???";
		}
	}


	/*
		
		This function cll to listener which you created with .on or .addEventCodeListener functions
		I.e if you create cllback function with .on method, this function call to she!
		.on('message', function(data){console.og(data)}); //Hello, world
		.emit('message', 'Hello, world!');

		@param eventType [string]: name of event, supported events you can see on github page
		@param data [...any...]

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
			var msg_r = vkr['response'][1];
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
		request.get(server + params, function(err, res, vkr){
			if (err) {
				self.emit('error', err);
			} else {
				try {
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

	/*
		
		So hhaaaard!!!
		Sory for my english, it was hard form me, describe this function.
		
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
		
		@param eventCode [number (desirable)]: This is eventCode from docs page
		@param eventType [string]: You can create name for your event
		@param handler [function]: Is handler-function (not callback)
		@param rewrite [boolean]: If you want rewire my handlers and get inforametion clean info from vk.com you can do this,
		just put for example 4, 'message', function(msg){ }, true in paramaters

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

	/*
	
		If my SDK not support certain event it doesnt mean that my SDK is not support it :D
		You can add yours listeners with this function.
		
		Docs: vk.com/dev/using_longpoll

		@param eventCode [number]: Number of event which you can finc on the docs pages
		@param handler [function]: Is a handler function

	*/


	addEventCodeListener(eventCode, handler) { //Only fro create new event listeneres (if there are not in default listeners, you can get a code and add it!)
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

module.exports = new VK();