"use strict";

let configuration = {};

// Default parameters
configuration.api_v = "5.75";
configuration.reauth = false;
configuration.save_session = true;
configuration.session_file = __dirname + "/.vksession";

// Constants
configuration.PROTOCOL = "https";
configuration.BASE_DOMAIN = "vk.com";
configuration.BASE_CALL_URL = configuration.PROTOCOL + "://" + "api." + configuration.BASE_DOMAIN + "/method/";
configuration.BASE_OAUTH_URL = configuration.PROTOCOL + "://" + "oauth." + configuration.BASE_DOMAIN + "/";



// This is the Windows client_id, changing it is not recommended

// Windows
configuration.WINDOWS_CLIENT_ID = "3697615";
configuration.WINDOWS_CLIENT_SECRET = "AlVXZFMUqyrnABp8ncuU";

// Android
configuration.ANDROID_CLIENT_ID = "2274003";
configuration.ANDROID_CLIENT_SECRET = "hHbZxrka2uZ6jB1inYsH";


// IOS
configuration.IOS_CLIENT_ID = "3140623";
configuration.IOS_CLIENT_SECRET = "VeWdmVclDCtn6ihuP1nt";

// Here are ids for platforms
configuration.platformIds = {
	"6": "WINDOWS",
	"2": "IOS",
	"4": "ANDROID"
};


module.exports = configuration;
