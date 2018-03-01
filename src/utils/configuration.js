"use strict";

let configuration = {};

configuration.api_v = "5.73";
configuration.reauth = false;
configuration.save_session = true;
configuration.session_file = __dirname + "/.vksession";
configuration.PROTOCOL = "https";
configuration.BASE_DOMAIN = "vk.com";
configuration.BASE_CALL_URL = configuration.PROTOCOL + "://" + "api." + configuration.BASE_DOMAIN + "/method/";
configuration.BASE_OAUTH_URL = configuration.PROTOCOL + "://" + "oauth." + configuration.BASE_DOMAIN + "/";
configuration.WINDOWS_CLIENT_ID = "2274003";
configuration.WINDOWS_CLIENT_SECRET = "hHbZxrka2uZ6jB1inYsH";

module.exports = configuration;