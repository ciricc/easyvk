"use strict";

const staticMethods = require("./staticMethods.js");

class Helpers {
	constructor (vk) {
		let self = this;
		self._vk = vk;
	}

	async getAllFriendsList(user_id) {
		let self = this;
		
		return new Promise((resolve, reject) => {
			
			self._vk.call("friends.get", {
				user_id: user_id,
				count: 10000
			}).then(({vkr, vk}) => {
				
				return resolve({
					vkr: vkr.response.items,
					vk: vk
				});

			}, reject);

		});

	}

	async isFriend(friend_id, check_id) {
		
		let self = this;
		
		if (friend_id) {
			friend_id = parseInt(friend_id);
		}

		if (!check_id || check_id <= 0) {
			check_id = self._vk.session.user_id;
		}

		if (check_id) {
			check_id = parseInt(check_id);
		}

		return new Promise((resolve, reject) => {
			
			self.getAllFriendsList(friend_id).then(({vkr: list, vk}) => {
				
				return resolve({
					vkr: list.indexOf(check_id) != - 1,
					vk: vk 
				});

			}, reject);

		});

	}

	async userFollowed (follower_id, user_id, maximum) {
		let self = this;
		
		if (user_id) {
			user_id = parseInt(user_id);
		}

		if (follower_id) {
			follower_id = parseInt(follower_id);
		}

		if (!user_id || user_id <= 0) {
			user_id = self._vk.session.user_id;
		}

		if (!maximum) {
			maximum = -1;
		}

		return new Promise((resolve, reject) => {
			
			let offset, followers, breakon;

			offset = 0;
			followers = [];
			breakon = false;

			async function getFollowers () {
				
				self._vk.call("users.getFollowers", {
					user_id: user_id,
					offset: offset
				}).then(({vkr, vk}) => {
					
					if ((maximum != -1 && vkr.response.count > maximum)) {
						
						return reject(
							new Error(`Maximum followers for user is: ${maximum}, user have ${vkr.response.count} followers`)
						);

					}
					
					if (vkr.response.items.indexOf(follower_id) != -1) {
						
						return resolve({
							vkr: true,
							vk: vk
						});

					}
					
					if (offset < vkr.response.count) {
						
						offset += 1000;
						
						setTimeout(() => {
							getFollowers();
						}, 200);

					} else {
						
						return resolve({
							vkr: false,
							vk: vk
						});

					}

				}, reject);

			}
			
			getFollowers();

		});

	}

}

module.exports = Helpers;