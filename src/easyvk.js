var request = require('request'); 
var fs = require('fs');
var encoding = require('encoding');
var WS = require('ws');

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
		this.api_v = "5.71";
		this.v = "0.2.81";

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
			if (Object.prototype.toString.call(api_v) !== "[object String]") api_v = self.api_v;

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
								if (reauth) throw "User wants to reauth";
								reject("Undefined access_token in file session!");
							}

						} catch (e) {
							console.log(session_json);
						
							var keys = [];
							if (Object.prototype.toString.call(session_json) == "[object Object]") {
								for (i in session_json) keys.push(i);
							}

							if (session_json.length == 0 || session_json == null || keys.length == 0) {
								if (username && password || reauth) {
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
									grant_type: "password",
									v: api_v
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
					access_token: access_token,
					v: api_v
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

			if (!data['access_token']) data['access_token'] = self.session['access_token'];
			if (!data['v']) data['v'] = self.api_v;

			if (self.session['captcha_sid']) data['captcha_sid'] = self.session['captcha_sid'];
			if (self.session['captcha_key']) data['captcha_key'] = self.session['captcha_key'];

			data = self.urlencode(data);

			request.get(self.BASE_CALL_URL + method_name + "?" + data, function(err, res){
				if (err) reject(err);
				try {
					var vkr = res.body;
					if (vkr[0] != "{") reject('Is not JSON' + vkr);
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
								if (rvk[0] != "{") reject('Is not JSON' + rvk);
								
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
							}, function(err, response){
								if (err) reject(err);
								var rvk = response.body;
								
								try {
									rvk = JSON.parse(rvk);
								} catch (e) {
									reject(e);
								}

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
				} else if (rvk['error']['message']) {
					return rvk['error']['message'];
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
	    
	    function serialiseObject (obj) {
		    var pairs = [];
			for (var prop in obj) {
				if (!obj.hasOwnProperty(prop)) {
					continue;
				}
				if (Object.prototype.toString.call(obj[prop]) == '[object Object]') {
					pairs.push(serialiseObject(obj[prop]));
					continue;
				}
				pairs.push(prop + '=' + encodeURIComponent(obj[prop]));
			}

			return pairs.join('&');
	    }

		var str = serialiseObject(object);
		return str;
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


	/*
		
		This function return Promise and in resolve method you can get list of all friends user_id's
		count 10000 - is maximum count of friends for one user. (See also - https://vk.com/page-53003970_46897420)

		@param {Number} user_id this is the user's id,  list of friends whom you want to receive
			
		@return {Promise}

	*/


	getAllFriendsList(user_id) {
		var self = this;

		return new Promise(function(resolve, reject){
			self.call('friends.get', {
				user_id: user_id,
				count: 10000
			}).then(function(rvk){
				resolve(rvk.response.items);
			}, reject);
		});
	}


	/*
		
		This function return Promise and in resolve method you can get true or false, which means friends whether the user of firend_id's


		@param {Number} friend_id this is the user's id,  which presumably a friend of check_id user
		@param {Number} check_id this is the user'd id, which presumably a friend of friend_id user.
		If this paramater was down, it will be user_id from vksession i.e your id from auth system.

		@return {Promise}

	*/

	isFriend(friend_id, check_id) {
		var self = this;

		if (!check_id || check_id <= 0) check_id = self.session.user_id;
		return new Promise(function (resolve, reject){
			self.getAllFriendsList(friend_id).then(function(list){
				resolve(list.indexOf(check_id) != - 1);
			}, reject);
		});
	}


	/*
	
		This function can help you get number of views live stream!
		This unofficial function, so she can to break in one of the moments!!! [!!! Warning !!!]


		@param {String} video_source_id is source_id from URL of video, for example: In URL (https://vk.com/video?z=video-34884057_456239322) video_id is -34884057_456239322
	

		@return {Promise}
	*/


	getLiveViews (video_source_id) {
		var self = this;


		return new Promise(function(resolve, reject) {

			if (!video_source_id || Object.prototype.toString.call(video_source_id) != '[object String]') {
				reject('video_source_id must be like -2222_222222222 (String only)');
			} 

			var headers = {
				'user-agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
				'content-type': 'application/x-www-form-urlencoded'
			};

			var al_video_url = self.PROTOCOL + '://' + self.BASE_DOMAIN + '/al_video.php';
			var video = video_source_id.split('_');
			var oid = video[0];
			var vid = video[1];

			//Get specify hash for get permissions to watch
			request.post({
				url: al_video_url,
				headers: headers,
				body: 'act=show&al=1&al_ad=0&autoplay=0&list=&module=videocat&video=' + video_source_id
			}, function(err, res, vkr){
				
				//Parsing hash from response body {"action_hash" : "hash"}
				var matCH = res.body.match(/(\"|\')action_hash(\"|\')(\s)?\:(\s)?(\'|\")(.*?)(\'|\")/);
				if (matCH) {
					var hash = matCH[0]
					.replace(/([\s\'\:\"])/g, "")
					.replace('action_hash', "");
					request.post({
						url: al_video_url + '?act=live_heartbeat',
						body: 'al=1&hash=' + hash + '&oid=' + oid + '&user_id=0&vid=' + vid,
						encoding: 'binary', //Special
						headers: headers,
					}, function(err, vkr, res) {
						
						var videoInfo = encoding.convert(vkr.body, 'windows-1252');
						videoInfo = videoInfo.toString();
						
						if (videoInfo.match('<!int>')) {
							var countViews = videoInfo.match('<!int>([0-9]+)<!>');
							
							if (countViews) {
								countViews = parseInt(countViews[1]);
								resolve(countViews);
							} else {
								reject('Maybe VK video page was changed, we can\'t get a number of views from response');
							}

						} else {
							reject('Maybe VK video page was changed, we can\'t get a number of views from response');
						}

					});
				} else {
					reject('The live video (' + video + ') is not streaming now!');
				}
			});
		});
	}


	//Only for me
	generate_error (msg) {

		return {
			error: {
				error_msg: msg
			}
		};

	}


	/*
		
		This function can check if the follower_id user is in the subscribers of the user_id user


		@param {Number} user_id is the user who needs to search for a follower_id subscriber
		@param {Number} follower_id is the follower user, if it was down it will be user_id from current Auth session
		@param {Number} maximum is number of max value for count subs. For example: if account has 500000 subs, and you put max 100K, then this user 
		will be skipped to not load the system


		@return {Promise}

	*/


	userFollowed (user_id, follower_id, maximum) {
		var self = this;
		if (!follower_id || follower_id <= 0) follower_id = self.session.user_id;
		if (!maximum) maximum = -1;

		return new Promise(function (resolve, reject) {
			var offset = 0;
			var followers = [];
			var breakon = false;

			function getFollowers () {
				self.call('users.getFollowers', {
					user_id: user_id,
					offset: offset
				}).then(function(rvk){

					if ((maximum != -1 && rvk.response.count > maximum)) {
						reject('Maximum followers for user is: ' + maximum + ' , user have ' + rvk.response.count + ' followers');
					}

					if (rvk.response.items.indexOf(follower_id) != -1) {
						resolve(true);
					}

					if (offset < rvk.response.count) {
						offset += 1000;
						getFollowers();
					} else {
						resolve(false);
					}

				});
			}

			getFollowers();

		});
	}

	/*
		
		Streaming API was added in 0.2.0 version. This API was documented on man page: https://vk.com/dev/streaming_api,
		My SDK can help you create rules easy and manage them too easy!

		@param {Object} application This object is your applications settings with two parameters:
		
		{
			client_id: '222222222 (example)',
			client_secret: 'SKflEUmyZlpgmgyvUS (example)'
		}, if it was down, you will get an error! Please, don't use Official windows app id and secret, or other, who can do this too, may be delete your settings! 

		Create own applications!! [Warning]
		

		@return {Promise}

	*/



	streamingAPI (application) {
		var self = this;
		return new Promise(function(resolve, reject){
			if (application && application.client_id && application.client_secret) {
				var params = {
					client_id: application.client_id,
					client_secret: application.client_secret, 
					v: self.api_v,
					grant_type: 'client_credentials'
				}

				params = self.urlencode(params);

				request.get(self.BASE_OAUTH_URL + 'access_token?' + params, function (err, res){
					


					if (err) {
						reject (err);
					}

					var vkr_client = res.body;

					try {
						vkr_client = JSON.parse(vkr_client);

						var error = self.check_error(vkr_client);
						
						if (error) {
							reject(error);
						}

						self.call('streaming.getServerUrl', {
							access_token: vkr_client.access_token
						}).then(function(vkr_server){

							self.streaming_session = {
								server: vkr_server.response,
								client: vkr_client
							}

							var wsc = new WS('wss://' + vkr_server.response.endpoint + '/stream?key=' + vkr_server.response.key );
							var streaming_connection = new StreamingAPI(self, wsc);
							
							resolve.call(streaming_connection, streaming_connection);
						}, reject);

					} catch (e) {
						reject(e);
					}

				});
			} else {
				reject('You need create your app on https://vk.com/editapp?act=create (Standalone) and then put your client_id and client_secret in this! Please, not use officiall app\'s for windows client_id and client_secret!!!')
			}
		});
	}

	//For me only
	encodeHtml (text) {
		return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
		.replace(/&quot;/g, "\"")
		.replace(/&#039;/g, "'");
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


class StreamingAPI {

	constructor (vk, wsc) {
		this._vk = vk;
		this._wsc = wsc;
		this.url_http = this._vk.PROTOCOL + '://' + this._vk.streaming_session.server.endpoint;
		this.key = this._vk.streaming_session.server.key;
		this.endpoint = this._vk.streaming_session.server.endpoint;
		this.listeners = {};

		this.__initConnection__();
	}

	__initConnection__ () {
		var self = this;
		
		self._wsc.on('open', function() {
			console.log('Streaming API Init successfully!');
		});	 

		self._wsc.on('error', function(error) {
		    self.emit('error', error.toString());
		});

		self._wsc.on('message', function(message) {
	        self.__initMessage__(message);
	    });

	    self._wsc.on('close', function() {
	    	self.emit('failure', 'Connection closed');
	    });

	}

	close () {

		var self = this;

		return  new Promise( function(resolve, reject) {
			if (self._wsc) {
				resolve(self._wsc.close());
			} else {
				reject("WebSocket not connected!!");
			}
		});
	}

	/*
		
		Read: LongPoll.on

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
		
		Read: LongPoll.emit

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

	__initMessage__ (body) {
		var self = this;

		try {
			body = JSON.parse(body);
			if (body.code == 100) {
				if (self.listeners[body.event.event_type]) {
					self.emit(body.event.event_type, body.event);
				} else {
					self.emit('pullEvent', body.event);
				}
			} else if (body.code == 300) {
				self.emit('serviceMessage', body.service_message);
			}
		} catch (e) {
			self.emit('error', e);
		}
	}

	/*
		
		This function add new rule in your stream. Only one!
		If you want add many rules, you need use rules manager with initRules() method!

		@param {String} rule is string rule, for exmaple: 'кот -собака'
		@param {String} tag is tag for rule


		@return {Promise}

	*/

	addRule (rule, tag) {
		var self = this;

		return new Promise (function(resolve, reject) {
			var url__post = self.url_http + '/rules?key=' + self.key;

			request.post({
				method: 'POST',
				url: url__post,
				json: {
					"rule": {
						"value": rule,
						"tag": tag
					}
				}
			}, function(err, res) {
				
				var rvk = res.body;

				if (err) {
					reject(err, null);
				}

				if (rvk) {
					try {
						
						if (rvk[0] != "{" && Object.prototype.toString.call(rvk) != "[object Object]") reject("Is not JSON!" + rvk); 
						if (Object.prototype.toString.call(rvk) != "[object Object]") rvk = JSON.parse(rvk);

						var error = self._vk.check_error(rvk);

						if (error) {
							reject(error, rvk.error.error_code);
						} else {
							resolve.call(rvk, true, rvk);
						}

					} catch (e) {
						reject(e, null);
					}
				} else {
					console.log("We don't know that error, vk returned us: ", res);
				}

			});
		});
	}

	/*
		
		This function delete rule in your stream. Only one!
		If you want delete many rules, you need use rules manager with initRules() method or deleteAllRules().
	
		@param {String} tag is tag for rule, which you want to delete


		@return {Promise}

	*/

	deleteRule (tag) {
		var self = this;


		return new Promise (function(resolve, reject) {
			var url__delete = self.url_http + '/rules?key=' + self.key;
			tag = tag.toString();

			request.delete({
				method: 'DELETE',
				url: url__delete,
				json: {
					"tag": tag
				}
			}, function(err, res) {
				
				var rvk = res.body;

				if (err) {
					reject(err, null);
				}
				
				if (rvk) {
					try {

						if (rvk[0] != "{" && Object.prototype.toString.call(rvk) != "[object Object]") reject("Is not JSON!" + rvk); 
						if (Object.prototype.toString.call(rvk) != "[object Object]") rvk = JSON.parse(rvk);

						var error = self._vk.check_error(rvk);

						if (error) {
							reject(error, rvk.error.error_code);
						} else {
							resolve(tag);
						}
					} catch (e) {
						reject(e, null);
					}
				} else {
					console.log("We don't know that error, vk returned us (Delete Rule): ", rvk);
				}
			});
		});
	}

	/*
	
		This function return in resolve function all your rules from stream

		@return {Promise}

	*/


	getRules () {
		var self = this;

		return new Promise (function(resolve, reject) {
			var url__get = self.url_http + '/rules?key=' + self.key;

			request.get({
				method: 'GET',
				url: url__get
			}, function(err, res) {
				var rvk = res.body;

				if (err) {
					reject(err, null);
				}
				
				if (rvk) {
					try {


						if (rvk[0] != "{" && Object.prototype.toString.call(rvk) != "[object Object]") reject("Is not JSON!" + rvk); 
						if (Object.prototype.toString.call(rvk) != "[object Object]") rvk = JSON.parse(rvk);
						

						var error = self._vk.check_error(rvk);

						if (error) {
							reject(error, rvk.error.error_code);
						} else {
							resolve.call(rvk, rvk.rules, true);
						}

					} catch (e) {
						reject(e, null);
					}
				}  else {
					console.log("We don't know that error, vk returned us (Get rule): ", rvk);
				}

			});
		});
	}


	/*
		@return {Promise}
	*/

	deleteAllRules() {
		var self = this;

		return new Promise (function(resolve, reject){
			self.getRules().then(function(rules){
				if (rules && rules.length > 0) {
					var i = 0;

					function del () {
						self.deleteRule(rules[i].tag).then(function(){
							i+= 1;

							if (i === rules.length) {
								resolve.call(this, [true, i]);
							} else {
								setInterval(function(){
									del();
								}, 1200);
							}

						})
					} 

					del();

				} else {
					resolve.call(this, [true, 0]);
				}

			}, reject); 			
		});

	}

	/*
		
		This method can help you create, delete and manage your rules too easy!
		For example: You need create your rules, cat, dog: 
			initRules({
				'cat': 'кошка',
				'dog': 'собака'
			});

		And after this, you may want to delete dog. If there was not this function, you would have to use deleteRule('dog'), but...
		I am created this method and so you can do it:
			initRules({
				'cat': 'кошка'
			});
		:D

		After this, if you want to replace/change already existing rule, you can do it:
			initRules({
				'cat': 'кошка киса'
			});
		
		After all manipulations, you can get changelog and result so:
			initRules({
				'cat': 'кошка'
			}).then(function(log){
				console.log(log); //{addedRules: {'cat': 'кошка'}, replacedRules: {}, deletedRules: {}}
			});

		It's very easy!

		@param {Object} rules
		@param {Function} errorHandler is function, which will be use when is some of actions arise new error. reject and this - is different functions, use 
		each for their own affairs!

		@return {Promise}

	*/

	initRules (rules, errorHandler) {
		var self = this;
		

		return new Promise (function(resolve, reject){
			
			if (Object.prototype.toString.call(errorHandler) !== "[object Function]") {
				errorHandler = function () {};
			}

			if (Object.prototype.toString.call(rules) !== "[object Object]") {
				rules = {};
			}

			self.getRules().then(function(st_rules){
				var st_rules__obj = {};
				var deletedRules = {};
				var replacedRules = {};
				var addedRules = {};
				var tagi, rules_tags;


				if (st_rules) {
					for (var i = 0; i < st_rules.length; i++) {
						st_rules__obj[st_rules[i].tag] = st_rules[i].value;
					}

					
					var tags__ = [];
					for (var tag in st_rules__obj) { tags__.push(tag); }
					var i__tag = 0;

					function initTag () {
						var tag = tags__[i__tag];
						i__tag += 1;
						if (rules[tag] != undefined) {
							if (Object.prototype.toString.call(rules[tag]) === "[object String]" && rules[tag] != st_rules__obj[tag]) {
								
								self.deleteRule(tag).then(function(t){
									if (t != false && t != undefined) {
										self.addRule(rules[t], t).then(function(){
											replacedRules[tag] = {
												last_val: st_rules__obj[tag],
												new_val: rules[tag]
											};
											nextTag(); 
										}, function(error){
											errorHandler.call(this, error, t, null);
										});
									}

								}, reject);


							} else if (Object.prototype.toString.call(rules[tag]) === "[object String]" && rules[tag] == st_rules__obj[tag]) {
								nextTag(); 
							} else {
								nextTag();
								errorHandler.call(this, "Value must be string type, if you want use word undefined, you need use it: \'undefined\' !!!", rules[tag], null);
							}
						} else {
							

							self.deleteRule(tag).then(function(){
								deletedRules[tag] = {
									val: st_rules__obj[tag] 
								};
								nextTag();
							}, function(err){
								errorHandler.call(this, err, tag, "delete_error");
							});

						}
					}

					function nextTag () {
						console.log(tags__);
						if (i__tag < tags__.length) {
							initTag();
						} else {
							runAdd();
						}
					}

					initTag();
				}

				function runAdd() {

					rules_tags = [];
					tagi = 0;

					for (var i in rules) rules_tags.push(i);

					addRule();

				}

				function addRule () {
					if (tagi == rules_tags.length) {
						return;
					}

					if (st_rules__obj[rules_tags[tagi]] === undefined) {
						self.addRule(rules[rules_tags[tagi]], rules_tags[tagi]).then(function(){


							addedRules[rules_tags[tagi]] = {
								tag: rules_tags[tagi],
								val: rules[rules_tags[tagi]]
							};

							tagi += 1;

							if (tagi < rules_tags.length) {
								addRule();
							} else {
								resolve.call(this, {
									added: addedRules,
									replaced: replacedRules,
									deleted: deletedRules
								});
							}
						}, function (err) {
							errorHandler.call(this, err, rules_tags[tagi], null);
						});

					} else {
						tagi += 1;

						if (tagi < rules_tags.length) {
							addRule();
						} else {
							resolve.call(this, {
								added: addedRules,
								replaced: replacedRules,
								deleted: deletedRules
							});
						}
					}
				}


			});

		});
	}
}