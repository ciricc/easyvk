"use strict";

const request = require("request");
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
			}).then((vkr) => {
				resolve(vkr.response.items);
			}, reject);
		});
	}

	async isFriend(friend_id, check_id) {
		let self = this;
		if (friend_id) friend_id = parseInt(friend_id);
		if (!check_id || check_id <= 0) check_id = self._vk.session.user_id;
		if (check_id) check_id = parseInt(check_id);
		return new Promise((resolve, reject) => {
			self.getAllFriendsList(friend_id).then((list) => {
				resolve(list.indexOf(check_id) != - 1);
			}, reject);
		});
	}

	async userFollowed (user_id, follower_id, maximum) {
		var self = this;
		if (user_id) user_id = parseInt(user_id);
		if (follower_id) follower_id = parseInt(follower_id);
		if (!follower_id || follower_id <= 0) follower_id = self._vk.session.user_id;
		if (!maximum) maximum = -1;

		return new Promise((resolve, reject) => {
			let offset = 0;
			let followers = [];
			let breakon = false;

			function getFollowers () {
				self._vk.call("users.getFollowers", {
					user_id: user_id,
					offset: offset
				}).then((vkr) => {
					if ((maximum != -1 && vkr.response.count > maximum)) {
						reject(new Error(`Maximum followers for user is: ${maximum}, user have ${rvk.response.count} followers`));
					}
					if (vkr.response.items.indexOf(follower_id) != -1) {
						resolve(true);
					}
					if (offset < vkr.response.count) {
						offset += 1000;
						setTimeout(() => {
							getFollowers();
						}, 200);
					} else {
						resolve(false);
					}
				});
			}
			getFollowers();
		});
	}

}

module.exports = Helpers;