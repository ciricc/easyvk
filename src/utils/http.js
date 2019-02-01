/**
 *   In this file are http widgets for EasyVK
 *   You can use it
 *
 *   Author: @ciricc
 *   License: MIT
 *   
 */


"use strict";

const configuration = require("./configuration.js");
const staticMethods = require("./staticMethods.js");

const fs = require("fs");
const request = require("request");
const FileCookieStore = require('tough-cookie-file-store');

const VKResponse = require("./VKResponse.js");
const AudioAPI = require("./AudioAPI.js");


class HTTPEasyVKClient {

	constructor ({_jar, vk, http_vk, config}) {
		
		let self = this;

		self._config = config;

		self.headersRequest = {
			"User-Agent": self._config.user_agent,
			"content-type": "application/x-www-form-urlencoded",
		};


		self.LOGIN_ERROR = 'Need login by form, use .loginByForm() method';
		self._vk = vk;
		self._authjar = _jar;

		// self._http_token = http_vk.session.access_token;

		self.audio = new AudioAPI(self._vk, self);
	}


	async readStories (vk_id = 0, story_id = 0)
	{
		let self = this;
		
		story_id = Number(story_id);
		if (isNaN(story_id)) story_id = 0;

		return new Promise((resolve, reject) => {
			vk_id = Number(vk_id);

			if (isNaN(vk_id)) return reject(new Error('Is not numeric vk_id'));

			//else try get sttories from user
			if (!self._authjar) return reject(new Error(self.LOGIN_ERROR));

			request.get({
				url: `${configuration.PROTOCOL}://m.${configuration.BASE_DOMAIN}/fv?to=/id${vk_id}?_fm=profile&_fm2=1`,
				jar: self._authjar,
				headers: self.headersRequest,
				agent: self._vk.agent
			}, (err, res, vkr) => {
				if (err) return reject(new Error(err));

				let stories = self.__getStories(res.body, 'profile');
				let i = 0;

				stories.forEach((story) => {
					if (Array.isArray(story.items)) {
						story.items.forEach(item => {
							
							self._story_read_hash = story.read_hash;

							if (story_id) {
									
								//Only one story
								if (item.raw_id === story_id) {
									self.__readStory(story.read_hash, item.raw_id, 'profile');
								}

							} else {

								//All stories
								self.__readStory(story.read_hash, item.raw_id, 'profile');

							}

							i++;
						});
					}
				});

				resolve({
					vk: self._vk,
					count: i
				});

			});
		});
	}

	__getStories(response='', type = 'feed') {
		response = String(response);

		let storiesMatch, superStories;

		if (type == 'feed') {
			storiesMatch = /cur\[\'stories_list_feed\'\]\=\[(.*?)\];/;
			superStories = /cur\[\'stories_list_feed\'\]\=/;
		} else {
			storiesMatch = /cur\[\'stories_list_profile\'\]\=\[(.*?)\];/;
			superStories = /cur\[\'stories_list_profile\'\]\=/;
		}

		let stories = response.match(storiesMatch);

		if (!stories || !stories[0]) return [];

		try {
			stories = JSON.parse(
				String(stories[0])
				.replace(superStories, '')
				.replace(/;/g, '')
			);

		} catch (e) {
			stories = [];
		}

		return stories;
	}

	__readStory (read_hash = '', stories = '', source = 'feed', cb) {
		let self = this;

		request.post({
			url: 'https://vk.com/al_stories.php',
			form: {
				'act': 'read_stories',
				'al': '1',
				'hash': read_hash,
				'source': source,
				'stories': stories
			},
			jar: self._authjar,
			headers: self.headersRequest,
			agent: self._vk.agent
		}, cb);
	}

	async readFeedStories ()
	{
		let self = this;

		return new Promise((resolve, reject) => {

			//else try get sttories from user
			if (!self._authjar) return reject(new Error(self.LOGIN_ERROR));

			request.get({
				url: `${configuration.PROTOCOL}://m.${configuration.BASE_DOMAIN}/fv?to=%2Ffeed%3F_fm%3Dfeed%26_fm2%3D1`,
				jar: self._authjar,
				headers: self.headersRequest,
				agent: self._vk.agent
			}, (err, res, vkr) => {
				if (err) return reject(new Error(err));

				//parse stories

				let stories = self.__getStories(res.body, 'feed');
				let i = 0;

				stories.forEach((story) => {
					if (Array.isArray(story.items)) {
						story.items.forEach(item => {
							self.__readStory(story.read_hash, item.raw_id, 'feed');
							i++;
						});
					}
				});

				resolve({
					vk: self._vk,
					count: i
				});

			});
		});
	}
}

class HTTPEasyVK {

	constructor (vk) {
		let self = this;

		self.headersRequest = {
			"content-type": "application/x-www-form-urlencoded",
		};

		self._vk = vk;
	}

	async __checkHttpParams (params = {}) {
		return new Promise((resolve, reject) => {
			

			if (!params.user_agent) {
				params.user_agent = configuration["HTTP_CLIENT"]["USER_AGENT"];
			}

			params.user_agent = String(params.user_agent);

			if (!params.cookies) {
				params.cookies = configuration["HTTP_CLIENT"]["COOKIE_PATH"];
			}

			params.cookies = String(params.cookies);


			return resolve(params);

		});
	}

	_parseResponse (e) {
        for (var o = e.length - 1; o >= 0; --o) {
            var n = e[o];
            if ("<!" === n.substr(0, 2)) {
                var i = n.indexOf(">"),
                    r = n.substr(2, i - 2);
                switch (n = n.substr(i + 1), r) {
                    case "json":

                        try {
                        	e[o] = JSON.parse(n);
                        } catch (e) {
                        	e[o] = {}
                        }

                        break;
                    case "int":
                        e[o] = parseInt(n);
                        break;
                    case "float":
                        e[o] = parseFloat(n);
                        break;
                    case "bool":
                        e[o] = !!parseInt(n);
                        break;
                    case "null":
                        e[o] = null;
                        break;
                    case "debug":
                    	console.log('debug');
                }
            }
        }

        return e;
    }

	async loginByForm (params = {}) {
		let self = this;

		return new Promise((resolve, reject) => {
			
			let pass = self._vk.params.password;
			let login = self._vk.params.username;

			if (!pass || !login) return reject(self._vk._error("http_client", {}, "need_auth"));

			self.__checkHttpParams(params).then((p) => {
				let params = p;
				
				self._config = params;

				self.headersRequest["User-Agent"] = self._config.user_agent;
				
				let cookiepath = self._config.cookies;


				if (!self._vk.params.reauth) {
					let data;

					if(!fs.existsSync(cookiepath)){
					    fs.closeSync(fs.openSync(cookiepath, 'w'));
					}	

					data = fs.readFileSync(cookiepath).toString();

					try {
						data = JSON.parse(data);
					} catch (e) {
						data = null;
					}

					if (data) {
						let jar = request.jar(new FileCookieStore(cookiepath));
						
						self._authjar = jar;

						return createClient(resolve);
					}
				}
				
				let easyvk = require('../index.js');

				easyvk({
					password: pass,
					username: login,
					save_session: false,
					reauth: true,
					proxy: self._vk.params.proxy
				}).then((vkHtpp) => {

					let vHttp = vkHtpp;

					easyvk = null;

					//Make first request, for know url for POST request
					//parse from m.vk.com page
					
					fs.writeFileSync(cookiepath, '{}');

					let jar = request.jar(new FileCookieStore(cookiepath));

					self._authjar = jar;

					if (Object.keys(jar._jar.store.idx).length) {

						return actCheckLogin().then(() => {
							return createClient(resolve, vHttp);
						}, (err) => {
							return goLogin();
						});
					}

					return goLogin();

					function goLogin() {
						request.get({
							headers: self.headersRequest,
							url: 'https://m.vk.com/',
							jar: self._authjar,
							agent: self._vk.agent
						}, (err, res, vkr) => {
							
							if (err) return reject(new Error(err));

							let body = res.body;

							let matches = body.match(/action\=\"(.*?)\"/);

							if (!matches) { // Если пользовтаель уже авторизован по кукисам, чекаем сессию
								return actCheckLogin().then(() => {
									return createClient(resolve, vHttp);
								}, reject);
							}

							let POSTLoginFormUrl = matches[1];

							if (!POSTLoginFormUrl.match(/login\.vk\.com/)) return reject(self._vk._error("http_client", {}, "not_supported"));

							actLogin(POSTLoginFormUrl).then(resolve, reject);
						});
					}

					async function actCheckLogin () {
						return new Promise((resolve, reject) => {

							request.post({
								url: "https://vk.com/al_im.php",
								jar: self._authjar,
								followAllRedirects: true,
								form: {
									act: "a_dialogs_preload",
									al: 1,
									gid: 0,
									im_v: 2,
									rs: "",
								},
								agent: self._vk.agent
							}, (err, res) => {

								if (err) return reject(err);
								
								res = res.body.split('<!>');
								res = self._parseResponse(res[5]);

								if (res.match(/\<\!json\>/)) {
									res = res.replace("<!json>", "");
									try {
										res = JSON.parse(res);
									} catch (e) {
										// 
										return reject("Need update session not valid json");
									}
									return resolve(true);
								}
								return reject("Need update session");

							});

						});
					}
					async function actLogin (loginURL) {
						return new Promise((resolve, reject) => {
							request.post({
								url: loginURL,
								jar: self._authjar,
								followAllRedirects: true,
								form: {
									'email': login,
									'pass': pass
								},
								agent: self._vk.agent
							}, (err, res, vkr) => {

								if (err) return reject(new Error(err));

								return createClient(resolve, vHttp);
							});
						});
					}

				}, reject);
				
				function createClient (r, vHttp) {
					
					let HTTPClient = new HTTPEasyVKClient({
						_jar: self._authjar,
						vk: self._vk,
						http_vk: vHttp,
						config: self._config,
						parser: self._parseResponse
					});

					return r({
						client: HTTPClient,
						vk: self._vk
					});
				}


			}, reject);

		});
	}
}	


module.exports = HTTPEasyVK;