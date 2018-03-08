const easyVK = require("../index.js");
const request = require("request");
const fs = require("fs");

errHandler = (err) => {
	console.log(err);
}

easyVK({

}).then(async (vk) => {

	let p = ["helpers", "isFriend", [1, 356607530]];
	vk[p[0]][p[1]](...p[2]).then(isFriend=>(isFriend||vk.helpers.userFollowed(...p[2])))
	.then(isAdded=>{
	    console.log((isAdded) ? "Вы добавили его в друзья!" : `Баллы не начислены, 
	        вы не добавили его в друзья! Попробуйте еще раз...`);
	}).catch(errHandler);

}).catch(errHandler);