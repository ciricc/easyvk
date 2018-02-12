var request = require('request');

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


module.exports = StreamingAPI;