var VK  = require('../index');


//In 0.0.9 version i am added a new feature - is support two factor authentication
//If your account uses this type of auth, you can simple login in my SDK with this
//If you use access_token, you not need two factor code, just use access_token)

var access_token = "your_access_token";
var user_id = 356607530;
var message = "Hi, Kirill! I am use your lib!";
var username = "username";
var password = "password";
var code = 100204; //Is a code from SMS or App like Google Authenticator


//null, null - is captcha_sid and capthe_key parameters
//false - is reauth parameter
//If you auth first, my SDK will report you that error was arose, but if you don't log this error, you never know about she

VK.login(username, password, null, null, true, code).then(function(session){
	
	VK.call('messages.send', {
		user_id: user_id,
		message: message
	}).then(function(rvk){
		console.log(rvk)
	}, function(error){
		console.log(error); //If access_toen no have permsissions or you got a captcha error, you need log this.
	});

}, function(error){
	console.log(error); //Log error, don't skip it, pls!
});


/*
	
	If you use object parameter, you can put code so

	VK.login({
		username: username,
		password: password,
		code: code
	}).then(...)

*/