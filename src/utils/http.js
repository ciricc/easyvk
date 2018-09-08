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

class HTTPEasyVKClient {

	constructor ({_jar, vk}) {
		
		let self = this;

		self.headersRequest = {
			"user-agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
			"content-type": "application/x-www-form-urlencoded",
		};


		self.LOGIN_ERROR = 'Need login by form, use .loginByForm() method';
		self._vk = vk;
		self._authjar = _jar;
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

	__readStory (read_hash = '', stories = '', source = 'feed') {
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
		});
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

	async getAudios (params = {}) {
		
		let self = this;

		return new Promise((resolve, reject) => {

			if (!self._authjar) return reject(new Error(self.LOGIN_ERROR));

			let uid = self._vk.session.user_id,
				playlist_id = -1, 
				offset = 0;

			if (params.vk_id) {
				params.vk_id = Number(params.vk_id);
				if (!isNaN(params.vk_id) && params.vk_id > 0) uid = params.vk_id;
			}

			if (params.playlist_id) {
				params.playlist_id = Number(params.playlist_id);
				if (!isNaN(params.playlist_id)) playlist_id = params.playlist_id;
			}

			if (params.offset) {
				params.offset = Number(params.offset);
				if (!isNaN(params.offset)) offset = params.offset;
			}

			if (!uid) return reject(new Error('User id not defined in your session, use vk.sesion.user_id = X'));

			request.post({
				jar: self._authjar,
				url: `${configuration.PROTOCOL}://${configuration.BASE_DOMAIN}/al_audio.php`,
				form: {
					act: 'load_section',
					al: 1,
					claim: 0,
					offset: offset,
					owner_id: uid,
					playlist_id: playlist_id,
					type: 'playlist'
				},
				encoding: "binary"
			}, (err, res, vkr) => {

				res.body = encoding.convert(res.body, 'utf-8', 'windows-1251').toString();

				if (err) return reject(err);

				if (!res.body.length) {
					return reject(new Error('No have access on this audio!'));
				}

				let json = res.body.match(/<!json>(.*?)<!>/);
				

				if (res.body.match(/<\!bool><\!>/)) {
					return reject(new Error('Blocked access for you'));
				}

				if (!json) {
					return reject(new Error('Not founded audios, maybe algorythm changed'));
				}

				try {
					json = JSON.parse(json[1]);
				} catch (e) {
					return reject(new Error('Not founded sounds, may be algorythm changed or just user blocked access for you'));
				}

				let audios = [];

				for (let i = 0; i < json.list.length; i++) {					
					let audio = json.list[i];

					audios.push({
						id: audio[0],
						owner_id: audio[1],
						source: self.__UnmuskTokenAudio(audio[2], self._vk.session.user_id),
						title: audio[3],
						artist: audio[4],
						duration: audio[5],
						icon: audio[14]
					});

				}

				if (!params.needAll) {
					json.list = undefined;
				}

				resolve({
					vk: self._vk,
					audios: audios,
					vkr: json
				});

			});

		});
	}

	getPlaylists (vk_id, playlist_id) {
		let self = this;

		return new Promise((resolve, reject) => {
			
		});
	}

	__UnmuskTokenAudio(e, vk_id = 1)
	{
		//This code is official algorithm for unmusk audio source
		//Took from vk.com website, official way, no magic
		
		var n = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=",
		    i = {
		        v: function(e) {
		            return e.split("").reverse().join("")
		        },
		        r: function(e, t) {
		            e = e.split("");
		            for (var i, o = n + n, r = e.length; r--;) i = o.indexOf(e[r]), ~i && (e[r] = o.substr(i - t, 1));
		            return e.join("")
		        },
		        s: function(e, t) {
		            var n = e.length;
		            if (n) {
		                var i = s(e, t),
		                    o = 0;
		                for (e = e.split(""); ++o < n;) e[o] = e.splice(i[n - 1 - o], 1, e[o])[0];
		                e = e.join("")
		            }
		            return e
		        },
		        i: function(e, t) {
		            return i.s(e, t ^ vk_id)
		        },
		        x: function(e, t) {
		            var n = [];
		            return t = t.charCodeAt(0), each(e.split(""), function(e, i) {
		                n.push(String.fromCharCode(i.charCodeAt(0) ^ t))
		            }), n.join("")
		        }
		    };

		function o() {
		    return false;
		}

		function r(e) {
		    if (!o() && ~e.indexOf("audio_api_unavailable")) {
		        var t = e.split("?extra=")[1].split("#"),
		            n = "" === t[1] ? "" : a(t[1]);
		        if (t = a(t[0]), "string" != typeof n || !t) return e;
		        n = n ? n.split(String.fromCharCode(9)) : [];
		        for (var r, s, l = n.length; l--;) {
		            if (s = n[l].split(String.fromCharCode(11)), r = s.splice(0, 1, t)[0], !i[r]) return e;
		            t = i[r].apply(null, s)
		        }
		        if (t && "http" === t.substr(0, 4)) return t
		    }
		    return e
		}

		function a(e) {
		    if (!e || e.length % 4 == 1) return !1;
		    for (var t, i, o = 0, r = 0, a = ""; i = e.charAt(r++);) i = n.indexOf(i), ~i && (t = o % 4 ? 64 * t + i : i, o++ % 4) && (a += String.fromCharCode(255 & t >> (-2 * o & 6)));
		    return a
		}

		function s(e, t) {
		    var n = e.length,
		        i = [];
		    if (n) {
		        var o = n;
		        for (t = Math.abs(t); o--;) t = (n * (o + 1) ^ t + o) % n, i[o] = t
		    }
		    return i
		}

		return r(e);
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

			if (!pass || !login) return reject(new Error('Need authenticate by password and username. This data not saving in session file!'));

			
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

				if (!POSTLoginFormUrl.match(/login\.vk\.com/)) return reject(new Error('Library does not support this authentication way... sorry'));

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
							vk: self._vk
						});

						return resolve({
							client: HTTPClient,
							vk: self._vk
						});

					});
				});
			}

		});
	}
}	


module.exports = HTTPEasyVK;