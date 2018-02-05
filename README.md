![EasyVK Logo](src/logo.jpg?raw=true "EasyVK can help you create applications on VK API easy!")
# EasyVK (VK API Manager)

This app helps you create an apps with vk api easy!
You can use it for know more: vk.com/dev/manuals

|[All examples](https://github.com/ciricc/easyvk/tree/master/tests) | [Example (bot)](https://github.com/ciricc/easyvk/blob/master/tests/mybot.js) | [Changelog](https://github.com/ciricc/easyvk/tree/master/changelog.txt) |
|---------------------------------------|---------------------------------------|-------------|

## What can it do?

1. Longpolling
2. Call to vk methods
3. Auth
4. Upload docs, voices to messages
5. Upload photos to messages
6. Two factor authentication
7. Save session
8. Captcha
9. Streaming API
10. Routine functions like isFriend and others


## What's new? (0.2)
I am added new features. The main one is the support of the Streaming API, which will help you collect information from various sources in real time. Also I could not pass by the convenience so I added a new convenient method for developers.

You can see all changes:
  

  * Streaming API
    * events
    * add new rules
    * delete all rules
    * manage rules easy with manager (auto-add auto-delete auto-change)
  * isFriend method, which help you check that user is friend for other user
  * getAllFriendsList method
  * userFollowed method, which help you check that user is subscribed on other user
  * encodeHtml method can encode symbols from & amp; to &


### Installation
I am using npmjs.org for storage my SDK. So, if you want to install my SDK on your project you can use this command
in your project core (clear node_modles folder).

  `npm install easyvk`

I recommend that you install 0.2.0 version. Then this readme will actual. Or you can got an error(s).
But if you install other version, you need read readme for this version not other!

And after this you can import it.

```javascript
var VK = require('easyvk');
```

### Usage

For first example, you can send messages with official method (vk.com/dev/methods/).
As we use Promises, we use Promise in some functions like `login`

```javascript
var VK = require('easyvk');

VK.login('username', 'password').then(function(session){
  
  VK.call('messages.send', {
    user_id: 356607530,
    message: 'Hello, Kirill. I am use your library!'
  });
  
}, function(error){
  
  console.log(error);
  
});
```

So you can look at the table with the list of parameters of the login method only if you put an object in this!!!
If you don't put object, you can look at next table.

| Parameter | Description| Default|
|-----------|------------|---------|
| username  | This username, if you want login with username and password, you can use it| - |
| password  | This password field | - |
| access_token | If you have your access_token you need enter him or you can login with password | - |
| captcha_sid | This field is captcha_sid, which you can get from error response, when make some call to API. If you got this, you need put it in parameters and then go to captcha_img url and enter captcha_key parameter as text on image | - |
| captcha_key | This field is text on image, which you get on captcha_img! (From error) | - |
| code | If you use 2 factor authentication, you must input code from sms or app in this field after get error | - |
| reauth | My SDK save your session if you login first time, but if you login not first, it will try get session from .vksession file. And if you want reauth with new params, you need set reauth param true | false |
| save_session | But you may be want do not save session in file, then you need set this parameter false | true |
| session_file | You can save session in your file if do nt want save in .vksession file. But i don't recommend do this | .vksession |
| api_v | My SDK uses now 5.69 API (2018) version but you can change it | 5.69 |

And if you use only arguments you need look at it!

```
.login(username, password, captcha_sid, captcha, reauth, code).then(...);
```

Sometimes you can get an error. This error may captcha_error. So what can you do?
You need get captcha_sid, captcha_img from console log and go to the captcha_img url and then put in captcha_key parameter text on image like this.

```javascript
VK.login({
  captcha_sid: '641431868246',
  captcha_key: 'vkMsfe'
}).then(...);
```

This error may  spread on all queries and so you need always catch it.
On account of authorization that is all (for now).

### Streaming API

With my SDK you can create your streams by Streaming API.

From 0.2 version i am added this feature in support list.
For connect to the stream and create it, you need create own application on [vk.com/editapp?act=create](http://vk.com/editapp?act=create) page.
Then you need save your client_id and client_secret. And then, you can create stream with `streamingAPI()` method

```javascript
VK.login("username", "password").then(function(){
  
  VK.streamingAPI({
    client_id: '222222',
    client_secret: 'wzkLEmKOlDflwaaWwdWM' //Example
  }).then(function(connection){
    console.log(connection);
  }, function(err){
    console.log(err);
  });

});
```

So, you created `connection` and if you read the documentation, it must be you wanted to add your own rules in the stream.
You can do this in several ways. But i recommend you use rules manager:

```javascript  
connection.initRules({
  'tag': 'value'
});
```

This manager can easily manage your rules. It automatically deletes the rules if it is not in the object, and also replaces it in case of changes. You can also add new rules to the existing rules easy. After all the changes, you will get a log-object in which there will be all changed / deleted / added rules.

```javascript
connection.initRules({
  'tag' : 'value changed'
}, function (error, tag, type){

  console.log(error, tag, type);

}).then(function(logObj){

  console.log(logObj);

});
```

But if you want just add / delete one rule, you can use it:

```javascript
connection.addRule('value', 'tag').then(function(){
  connection.deleteRule('tag');
});
```

Or if you want to delete ALL  rules:

```javascript
connection.deleteAllRules().then(...);
```


Once you have defined the rules, you need to "listen" to the websocket event. You can see the following table to see what events you can get.

```javascript
/* Usage */

connection.on('eventType', function (eventData) {
  console.log(eventData);
});
```

| EventType | Description |
| --------- | ---------- |
| pullEvent | Arises when when the websocket receives a message from the VK that a stream event has occurred. This event can help you create listener for any type of events. I.e any event on stream call to this  event. But only if this event does not define its own listener|
| failure | Arises when websocket fail |
| error | Is calls when on websocket connection arise som error |
| serviceMessage | Arises when VK sends new service message |

All types of events you can read on [this page](https://vk.com/dev/streaming_api_docs_2), to now, there are `post`, `share`, `comment`.

Warning: `error` and `failure` it's mine events and they do not apply to the VK API!

For example: 

If you want listen only `post` event, then you need use it:

```javascript
connection.on('post', function(event){
  console.log(event);
});
```

And if you want listen all types of event on websocket (besides failure, error, serviceMessage), you need use it:

```javascript
connection.on('pullEvent', function(event){
  console.log(event);
});
```


### Longpolling (Bots)

With my SDK you can create yours message bots, which will be use a longpoll server.
This snippet creates simple longpoll listener and log all messages!
If you want understand what means each field in `message` you need to go on [messages.get](vk.com/dev/messages.get)

```javascript
VK.login("username", "password").then(function(session){
  VK.longpoll().then(function(connection){
    connection.on('message', function(message){
      console.log(message);
    });
  });
}, function(error){
  console.log(error);
});
```

You can see which type of events my SDK support.

| EventCode | EventType | Description |
| ---------- | --------- | ---------- |
|    4      | message   | Arises when your friend send the message. You can to distinguish one from one's own message.|
|    8      | friendOnline   | Arises when your friend becomes online |
|    9      | friendOffline   | Arises when your friend becomes offline |
|    51     | editChat | Arises when some user change/edit chat |
|    61      | typeInDialog   | Arises when user typing for in dialog with you |
|    62      | typeInChat   | Arises when some of users in chat is typing |
|    -    | failure | Arises when server returns error. You can catch it and make something... |
|    -    | error | Arises when in my code occurets any error |
|    -    | close | Arises when USER / PROGRAMMER closed connection by .close() method |

But i am unserstand that you may want to create your listeners or your handlers.
And i gave this opportunity. (:D)

If you want add only one listener and  not create new event, you can use this snippet

```javascript
VK.login("username", "password").then(function(session){
  VK.longpoll().then(function(connection){
    connection.addEventCodeListener(70, function(rvk){
      console.log(rvk); //User is calls (but user can't call :D )
    });    
  });
}, function(error){
  
  console.log(error);
  
});
```

Or if you want to create new event you can do this with this snippet.

```javascript
VK.login("username", "password").then(function(session){
  VK.longpoll().then(function(connection){
    connection.addEventType(70, 'call', function(rvk){
      console.log(rvk); //User is calls (but user can't call :D )
    });

    /*..and then you can do this
      
      .on('call', function(){
  
      });

    */

  });
}, function(error){
  
  console.log(error);
  
});
```

But what can i do if i want rewrite your handler?
You can do this.

```javascript
VK.login("username", "password").then(function(session){
  VK.longpoll().then(function(connection){
    connection.addEventType(4, 'message', function(rvk){
      console.log(rvk); //rvk - is response from vk (oooooh shit...)
    }, true);    
  });
}, function(error){
  
  console.log(error);
  
});
```

In this case last parameter was true? Yes. Because this parameter is "rewrite".

### Voice messages, docs for messages

In 0.1.0 version i am added new feature - upload voice, photos, doc in messages
And this snippet shows how you can use it!

```javascript
VK.login("username", "password").then(function(session){
	var type = "audio_message"; //Type can be else doc or graffiti
	var user_id = 356607530;

	VK.uploadDoc("./my_voice.wav", user_id, type).then(function(voice_doc){
		
		VK.call('messages.send', {
			user_id: user_id,
			attachment: ["doc"+voice_doc.owner_id+"_"+voice_doc.id]
		}).then(function(vkr){
			console.log(vkr);
		}, function(error){
			console.log(error);
		});

	}, function(error){
		console.log(error);
	});

}, function(error){
	console.log(error);
});
```


### Upload photos in messages


Such as upload voices you can upload photos in messages

```javascript

VK.uploadPhotosMessages(['./images/left.jpg', './images/home.jpg']).then(...);

//Or if you want upload only one pic

VK.uploadPhotoMessages('./images/home.jpg').then(...);


//Or if you want upload for group messages
var peer_id = 356607530;

VK.uploadPhotoMessages('./images/home.jpg', peer_id).then(...);
VK.uploadPhotosMessages(['./images/home.jpg'], peer_id).then(...);

```


## Helpers

In 0.2 version i am added new type of methods - helpers. Helpers can help you do something very easy. For example, you can get all user's friends with it:

```javascript
VK.login("username", "password").then(function(){
  var user_id = 356607530;
  VK.getAllFriendsList(user_id).then(function(friends){
    console.log(friends);
  });
});
``` 

Or you can check that follower_id is followed on user_id. And if follower_id was down, it will be your user_id from login session.

```javascript  
VK.login("username", "password").then(function(){
  
  var user_id = 356607530;
  var follower_id = 279411716;

  VK.userFollowed(user_id, follower_id).then(function(followed){
    console.log(followed);
  });

});
```

Also you can check that friend_id is friends with user_id. And if friend_id was down, it will be your user_id from login session.

```javascript  
VK.login("username", "password").then(function(){
  
  var user_id = 356607530;
  var friend_id = 279411716;

  VK.isFirend(user_id, friend_id).then(function(isfriend){
    console.log(isfriend);
  }, errHandler);

});
```

## Watch live stream video (count views)

Started from 0.2 version you can get live views count on video. Unfortunately VK API does not give us the opportunity to get the number of live video views, so I wrote this convenient method, which can help with creating your own video statistics without unnecessary gestures.

[WARNING!!] This method is informal and therefore at any time it can stop working correctly.
You can use it so:

```javascript
//No need login 

setInterval(function(){
  //You can use this method without login!
  var video_id_from_url = '-16487904_456239423';

  VK.getLiveViews(video_id_from_url).then(function(views){
    console.log(views);
  }, errHandler);
}, 3000);
```


## What's next? (0.3.0?)

I don't know.

Bye.