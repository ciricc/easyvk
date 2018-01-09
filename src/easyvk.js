var request = require('request'); 
var fs = require('fs');
class VK {
	constructor() {

		this.PROTOCOL = "https"; //Standart protocol, vk.com demand this protocol for communicate
		this.BASE_DOMAIN = "vk.com";
		this.BASE_CALL_URL = this.PROTOCOL + "://" + "api." + this.BASE_DOMAIN + "/method/";
		this.BASE_OAUTH_URL = this.PROTOCOL + "://" + "oauth." + this.BASE_DOMAIN + "/";
		this.WINDOWS_CLIENT_ID = "2274003";
		this.WINDOWS_CLIENT_SECRET = "hHbZxrka2uZ6jB1inYsH"; //And this
		this.session_file = __dirname + "/.vksession"; //File that stores itself json-session
		this.DEFAULT_2FACODE = ""; //Two factor code
		this.session = {};
		this.api_v = "5.69";
		this.v = "0.1.2";

	}

	/*

		Authorization and session creation function.
		Use it to create a session for an windows application.

		@param {String} {Object} username_arg if you put username_arg as object then all arguments will be use from it else it is just a username string (email, phone and what else?)
		@param {String} password_arg if you puted an username_arg as a string then you must put this parameter
		@param {Number} {String} captcha_sid_arg if you got an error from last query, you must put a captcha_sid from error info and captcha_key (just a text on image) parameter
		@param {String} captcha_key text on captcha
		@param {Number} {String} code_arg is code from two factor message. It may be sms code or app code (for example, Google Authenticator)
		
		@return {Promise}

	*/

	login (username_arg, password_arg, captcha_sid_arg, captcha_key_arg, reauth_arg, code_arg) {
		

		var self = this;
		var username, password, access_token, captcha_sid, captcha_key, scope, save_session, reauth, username, code, api_v;

		return new Promise(function(resolve, reject){
			
			if (Object.prototype.toString.call(username_arg) == "[object String]") {
				if (Object.prototype.toString.call(password_arg) == "[object String]") {
					username = username_arg;
					password = password_arg;
					captcha_sid = captcha_sid_arg;
					captcha_key = captcha_key_arg;
					reauth = reauth_arg;
					code = code_arg;
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
				save_session = p.save_session;
				reauth = p.reauth;
				username = p.username;
				code = p.code;
				api_v = p.api_v;

				if (p.session_file) {
					self.session_file = p.session_file;
				}

			}

			if (!captcha_sid) captcha_sid = "";
			if (save_session != false || save_session != 0) save_session = true;
			if (reauth != true || reauth != 1) reauth = false;
			if (!code) code = self.DEFAULT_2FACODE;
			if (captcha_sid) self.session['captcha_sid'] = captcha_sid;
			if (captcha_key) self.session['captcha_key'] = captcha_key;
			if (Object.prototype.toString.call(api_v) !== "[object String]") self.v = api_v;

			if (username &&  password && access_token) {
				reject("Please, enter only access_token or only password with username. Not all together!");	
			}

			if ((username && password && !access_token) || (!password && !username && !access_token)) {
				var not_finded_session = false;
				fs.readFile(self.session_file, function(err, session_json){
					if (err) {
						reject(err);
					} else {
						try {
							session_json = JSON.parse(session_json);
							if (session_json['access_token']) {
								if (!reauth) {
									self.session = session_json;
									resolve(self.session);
								} else {
									session_json = "";
									throw "User wants to reauth";
								}
							} else {
								reject("Undefined access_token in file session!");
							}

						} catch (e) {
							if (session_json.length == 0) {
								if (username && password) {
									not_finded_session = true;
								} else {
									reject("Session file is empty! Please, enter username and password or only access_token fields!");
								}

								var params = {
									username: username,
									password: password,
									client_id: self.WINDOWS_CLIENT_ID,
									client_secret: self.WINDOWS_CLIENT_SECRET,
									captcha_sid: captcha_sid,
									captcha_key: captcha_key,
									grant_type: "password"
								}

								if (code.toString().length != 0 && code) {
									params['2fa_supported'] = 1;
									params['code'] = code;
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
												


												self.session = vkr;
												
												if (save_session) {
													self.save_session();
												}

												resolve(self.session);
											}	

										} catch(e) {
											reject(e);
										}

									});
								}
							} else {
								reject(e);
							}
						}
					}
				});
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

		@param {String} method_name is just a method name :D (messages.get/wall.edit and others)
		@param {Object} data  if vk.com asks a parameters, you can send they. (Send access_token to this from session is not necessary, but also you can do this)
		
		@return {Promise}

	*/

	call(method_name, data) {
		var self = this;

		return new Promise(function(resolve, reject){
			if (!method_name) reject("Undefined method!");
			if (!data) data = {};

			data['access_token'] = self.session['access_token'];
			if (!data['v']) data['v'] = self.api_v;

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
		
		It is first version and will be debug.
		No docs, no comments (for now)

	*/

	uploadPhotoMessages(file_name, peer_id) {
		var self = this;
		return new Promise(function(resolve, reject){
			var data = {};
			if (!isNaN(Number(peer_id))) data['peer_id'] = peer_id;
			self.call('photos.getMessagesUploadServer', data).then(function(rvk){
				try {
					rvk = rvk.response;
					if (rvk.upload_url) {
						var stream = fs.createReadStream(file_name);
						
						stream.on('error', function(err){
							throw err;
						});

						stream.on('open', function(){
							request.post({
								method: 'POST',
								uri: rvk.upload_url,
								formData: {
									photo: stream
								}
							}, function(err, response, rvk){
								if (err) reject(err);
								rvk = JSON.parse(rvk);
								self.call('photos.saveMessagesPhoto', {
									photo: rvk.photo,
									server: rvk.server,
									hash: rvk.hash
								}).then(function(photo){
									resolve(photo.response[0]);
								}, reject);
							});
						});

					} else {
						throw "Undefined upload_url (maybe API was updated or this method was deleted)";
					}
				} catch (e) {
					reject(e);
				}
			}, reject);
		});
	}

	/*
		
		It is first version and will be debug.
		No docs, no comments (for now)

	*/

	uploadPhotosMessages(photos, peer_id) {
		var self = this;
		return new Promise(function(resolve, reject){
			try {
				if (Array.isArray(photos)) {
					var result = [];
					var i = 0;
					function loadNewPhoto() {
						if (i == photos.length) {
							resolve(result);
						} else {
							self.uploadPhotoMessages(photos[i], peer_id).then(function(photo){
								result.push(photo);
								i++;
								loadNewPhoto();
							}, function(err){
								reject(err);
							});
						}
					}
					loadNewPhoto();
				} else {
					throw "You puted not array photos!;"
				}
			} catch (e) {
				reject(e);
			}
		});
	}

	/*
		
		It is first version and will be debug.
		No docs, no comments (for now)

	*/


	uploadDoc(doc, peer_id, type) {
		var self = this;

		return new Promise(function(resolve, reject){
			var data = {type:"doc"};
			if (!isNaN(Number(peer_id))) data['peer_id'] = peer_id;
			if (Object.prototype.toString.call(type) === "[object String]") data['type'] = type; 

			self.call('docs.getMessagesUploadServer', data).then(function(rvk){
				try {
					rvk = rvk.response;
					if (rvk.upload_url) {
						var stream = fs.createReadStream(doc);
						
						stream.on('error', function(err){
							throw err;
						});

						stream.on('open', function(){
							request.post({
								method: 'POST',
								uri: rvk.upload_url,
								formData: {
									file: stream
								}
							}, function(err, response, rvk){
								if (err) reject(err);
								rvk = JSON.parse(rvk);
								self.call('docs.save', {
									file: rvk.file
								}).then(function(rvk_doc){
									resolve(rvk_doc.response[0]);
								}, reject);
							});
						});

					} else {
						throw "Undefined upload_url (maybe API was updated or this method was deleted)";
					}
				} catch (e) {
					reject(e);
				}
			}, reject);
		});

	}



	/*
		
		This function gets the server, ts and key parameters from api.vk.com for create a long-poll connection.

		@return {Promise}

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
		
		If you need get the platform by id, you can do this with this function
		
		Docs: https://vk.com/dev/using_longpoll_2?f=7.+Платформы
		@param {Number} platformID is a platform_id, which you can find on docs-page

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
				} else if (rvk['error'] == "need_validation") {
					var type = "sms";
					if (rvk['validation_type'].match('app')) type = "app";
					return "Please, enter your "+ type +" code in code parameter!";
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
	
		This function return a GET url with parameters. If you want get url encoded string from object you can use it.

		@param {Object} object it is clear, man! it just a object.................. :(
		
		@return {String}

	*/

	urlencode(object = {}) {
		var parameters = "";
		
		for (let key in object) {
			if (parameters != "") {parameters += "&";}
			if (String(object[key]).match(/&/)) { //Sometimes vk.com love push to response many parameters like: {key: "yourkey....&version=2"} ...
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
			8: 'friendOnline',
			9: 'friendOffline',
			51: 'editChat',
			61: 'typeInDialog',
			62: 'typeInChat',
		};
	}
	
	/*

		This function create a listener (callback) for eventType
		If vk.com return an updates array and my sdk have this event in eventTypes object, you can listen it with yours handlers
		Example:
			vk.com returned me that user Kirill sended message to user Maksim
			and you can listen it
			.on('message', function(msg){console.log(msg)});
		Ok?

		@param {String} eventType name of event, supported events you can see on github page
		@param {Function} callback callback-function which get an answer from vk.com

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
		
		This function calls to listener which you created with .on or .addEventCodeListener functions
		I.e if you create csllback function with .on method, this function call to she!
		.on('message', function(data){console.og(data)}); //Hello, world
		.emit('message', 'Hello, world!');

		@param {String} eventType name of event, supported events you can see on github page
		@param {Any} data

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
		
		@param {Number} eventCode this is eventCode from docs page
		@param {String} eventType you can create name for your event
		@param {Function} handler is handler-function (not callback)
		@param {Boolean} rewrite if you want rewrire my handlers and get clean information from vk.com you can do this,
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
	
		If my SDK not support certain event it doesn't mean that my SDK not support it :D
		You can add yours listeners with this function.
		
		Docs: vk.com/dev/using_longpoll

		@param {Number} eventCode number of event which you can find on the docs page
		@param {Function} handler is a handler function

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

module.exports = new VK();
