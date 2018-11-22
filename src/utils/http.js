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
const request = require("request");
const encoding = require("encoding");
const VKResponse = require("./VKResponse.js");
const AudioAPI = require("./AudioAPI.js");



class HTTPEasyVKClient {

	constructor ({_jar, vk, http_vk}) {
		
		let self = this;

		self.headersRequest = {
			"user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
			"content-type": "application/x-www-form-urlencoded",
		};


		self.LOGIN_ERROR = 'Need login by form, use .loginByForm() method';
		self._vk = vk;
		self._authjar = _jar;
		self._http_token = http_vk.session.access_token;

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
				jar: self._authjar
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
			jar: self._authjar
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
				jar: self._authjar
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
			"user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
			"content-type": "application/x-www-form-urlencoded",
		};

		self._vk = vk;
	}


	async loginByForm () {
		let self = this;

		return new Promise((resolve, reject) => {
			
			let pass = self._vk.params.password;
			let login = self._vk.params.username;

			if (!pass || !login) return reject(self._vk._error("http_client", {}, "need_auth"));

			
			let easyvk = require('../index.js');

			easyvk({
				password: pass,
				username: login,
				save_session: false,
				reauth: true
			}).then((vkHtpp) => {

				let vHttp = vkHtpp;

				easyvk = null;

				//Make first request, for know url for POST request
				//parse from m.vk.com page
				let jar = request.jar();

				self._authjar = jar;

				request.get({
					headers: self.headersRequest,
					url: 'https://m.vk.com/',
					jar: self._authjar
				}, (err, res, vkr) => {
					
					if (err) return reject(new Error(err));

					let body = res.body;

					let matches = body.match(/action\=\"(.*?)\"/);
					let POSTLoginFormUrl = matches[1];

					if (!POSTLoginFormUrl.match(/login\.vk\.com/)) return reject(self._vk._error("http_client", {}, "not_supported"));

					actLogin(POSTLoginFormUrl).then(resolve, reject);
				});


				function actLogin (loginURL) {
					return new Promise((resolve, reject) => {
						request.post({
							url: loginURL,
							jar: self._authjar,
							followAllRedirects: true,
							form: {
								'email': login,
								'pass': pass
							}
						}, (err, res, vkr) => {

							if (err) return reject(new Error(err));

							let HTTPClient = new HTTPEasyVKClient({
								_jar: self._authjar,
								vk: self._vk,
								http_vk: vHttp
							});

							return resolve({
								client: HTTPClient,
								vk: self._vk
							});

						});
					});
				}

			}, reject);

		});
	}
}	


module.exports = HTTPEasyVK;