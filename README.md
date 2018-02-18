![EasyVK Logo](src/logo.jpg?raw=true "EasyVK can help you create applications on VK API easy!")
# EasyVK (VK API Manager)

This app helps you create an apps with vk api easy!
You can use it for know more: vk.com/dev/manuals

|[All examples](https://github.com/ciricc/easyvk/tree/master/tests) | [Example (bot)](https://github.com/ciricc/easyvk/blob/master/tests/mybot.js) | [Changelog](https://github.com/ciricc/easyvk/tree/master/changelog.txt) | [Community / News](https://vk.com/npm_easyvk)
|---------------------------------------|---------------------------------------|-------------|------------|

## What can it do?

1. Longpolling
2. Callback API
3. Call to vk methods
4. Auth
5. Upload docs, voices to messages
6. Upload photos to messages
7. Two factor authentication
8. Save session
9. Captcha
10. Streaming API
11. Routine functions like isFriend and others


## What's new? (0.3)
I am added new features. The main one is the support of the Callback API. All methods like longpoll(), StreamingAPI(), and others... now is async!
Fixed other mini bugs. 

Created our community group in VK. If you need a help, [join us](https://vk.com/npm_easyvk)!

You can see all changes in [changelog](https://github.com/ciricc/easyvk/tree/master/changelog.txt) file.

##Need a help?

You can join us in our community - https://vk.com/npm_easyvk. Or you can create new issue on [github page](https://github.com/ciricc/easyvk/).


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
| api_v | My SDK uses now 5.73 API (2018) version but you can change it | 5.73 |

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


### Callback API

I have long time to make support for Callback API, so from 0.3 version you can use callback api server.

It built on the express and http modules. And so, you can use it too.
Callback API can help you  create listening server which will be listen all events from you group.

My SDK supports multigroup mode. i.e you can create only one server for all groups and receive all calls.
For use it you need to create your group and setting up it in easyvk so

```javascript

var httpPort = (process.env.PORT || 5000);

VK.callbackAPI({
  group_id: 'your_group_id',
  confirmCode: 'confirmation_code',

  //Only if your group use it and uniq for one group
  secret: 'secret_key (password from settings groups)'
  port: httpPort
}).then(function(connection){
  connection.on('message_new', function (messageEvent) {
    console.log(messageEvent.object) //message object
  });
}, function (error) {
  console.log('[CallbackAPI Error]', error);
});


```

My SDK support many groups, so, you can use it

```

VK.callbackAPI({
  groups: [
    {
      group_id: 'wdwd',
      //....
    },

    {
      group_id: 'groups_id',
      //....
    }
  ],
  port: httpPort
}).then(/*func....*/);

```

If you use a secret key from group, you need add a secret parameter. And if POST query will be contents secret otic from your,
you get an error (you can catch it).

So, look at the table. This table show you list of all events which you can listen

| EventType | Description |
| --------- | ---------- |
| secretError | Arise when one of request contents a key is different from the specified one or there is none at all |
| confirmationError | Arises when confirmation process get an error (for example, came a request in which the group_id is specified, which you do not have) |
| .... all vk events | You can see list of all events here: https://vk.com/dev/callback_api for example: `message_new` |

If you want to do something with your group (for example: reply to messages), you need login with your group_access_token

```javascript

VK.login({
  access_token: 'group_access_token'
}).then(function(session){
  
  VK.callbackAPI({
    /*see above*/
  }).then(function(connection){
    
    connection.on('message_new', function(messageEvent) {
      var msg = messageEvent.object;

      VK.call('messages.send', {
        peer_id: msg.user_id,
        message: 'Hello!'
      });

    });

  }, function (error) {
    console.log('[CallbackAPI Error]', error);
  });

}, function (error) {
  console.log(error);
});


```

#### What i need to do?

If you do not understand how to use it (Callback API), see our instructions

1. Create your public group or... just group, sorry
2. Get confirmation token, group id, switch all events which you need listen
3. Download easyvk and npm, nodejs
4. Initialize callback server (example above)
5. Run your script on the server with public IP and public access, for example: heroku, or you can buy a server
6. Profit

If you don't understand, contact me in any convenient way.
Thank you.


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

  VK.isFriend(user_id, friend_id).then(function(isfriend){
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

Bye.
