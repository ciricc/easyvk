var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');


class CallbackAPI {

	constructor (vk) {
		var self = this;
		
		self._vk = vk;
		self.listeners = {};
		self.cb_server = self.initServer();
		
		return self;
	}

	initServer () {
		var self = this;

		var app = express();

		//use body parser for parse post request
		app.use(bodyParser.json());
		
		app.post('/', function (req, res) {
			self.initPostRequest(req, res);
		});

		app.get('/', function(req, res){
			res.status(404).send('Not Found');
		});


		var server = http.createServer(app);
		server.listen(self._vk._cbparams.port);

		return server;
	}

	/*
		
		That's only for me

	*/

	initPostRequest (req, res) {
		var self = this;
		var post = req.body;

		var group = self._vk._cbparams.groups[post.group_id.toString()];

		if (post.type == 'confirmation') {

			if (group) {
				if (group.secret) {
					if (post.secret && post.secret == group.secret) {
						res.status(200).send(group.confirmCode);
					} else {
						res.status(400).send('secret error');
						self.emit('secretError', {
							body: req.body,
							group: group,
							info: 'We got the secret key which no uses in your settings! If you want to add secret, set up it in secret parameter!'
						});
					}
				} else {
					res.status(200).send(group.confirmCode);
				}

			} else {
				self.emit('confirmationError', {
					body: req.body,
					group: group,
					info: 'Occured confirmation error, you haven\'t this group_id in settings!'
				});
			}

		} else if (post.type !== 'confirmation') {
			
			if (group.secret) {
				if (post.secret && post.secret !== group.secret) {
					self.emit('secretError', {
						body: req.body,
						group: group,
						info: 'We got the secret key which no uses in your settings! If you want to add secret, set up it in secret parameter!'
					});

					return;
				} else if (!post.secret) {
					req.status(400).send('secret error');
					self.emit('secretError', {
						body: req.body,
						group: group,
						info: 'Server sended us request without secret_key, but you use it! Delete from settings or add in vk.com this key!'
					});
				}
			}

			self.emit(post.type, post);
			res.status(200).send('ok');

		} else {
			res.status(400).send('only vk requests');
		}
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
}


module.exports = CallbackAPI;