# Easyvk (VK API Manager)

This app helps you create an apps with vk api easy!
You can use it for know more: vk.com/dev/manuals

|[All examples](https://github.com/ciricc/easyvk) | [Example (bot)](https://vk.com/sayme_bot) |
|---------------------------------------|---------------------------------------|

## What can it do?

1. Longpolling
2. Call to vk methods
3. Auth
4. Upload docs, voices to messages
5. Upload photos to messages
6. Two factor authentication
7. Save session
8. Captcha 

### Installation
I am using npmjs.org for storage my SDK. So, if you want to install my SDK on your project you can use this command
in your project core (clear node_modles folder).

  `npm install easyvk`

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

Login method create session and then save to the file `.vksession`, after first login next login will login by this file, if you want to reauth with new parameters you need this use snippet.

```javascript

VK.login({
  username: 'username',
  password: 'password',
  reauth: true
}).then(...)

```

If you use access_token then you can put it in login function.

```javascript

VK.login({
  access_token: "c4d6fdca71d3898132c74a45b4b8d4deb...",
  reauth: true
}).then(...);

```

Sometimes you can get an error. This error may captcha_error. So what can you do?
You need get captcha_sid, captcha_img from console log and go to the captcha_img url and then put in captcha_key parameter text on image like this.

```javascript

VK.login({
  access_token: "c4d6fdca71d3898132c74a45b4b8d4deb...",
  reauth: true,
  captcha_sid: '641431868246',
  captcha_key: 'vkMsfe'
}).then(...);

```

This error may  spread on all queries and so you need always catch it.
On account of authorization that is all (for now).

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
      console.log(rvk); //User is calls (but user can't call :D ) //Надо доделать тут описание
    }); 
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
	var type = "voice_message";
	var user_id = 356607530;

	VK.uploadDoc("my_voice.wav", user_id, type).then(function(voice_doc){
		
		VK.call('message.send', {
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

For now my SDK can very little, but if you help me with ideas, i create new features and write code!
So, ....



## What's next? (0.2.0?)

In next versions i will add upload all types of files (documents, photos, audio etc)
Working with products. And little functions like isFriend(), isMember() and other.
It will be cool, guys! And you can help me with crete it: vk.com/kinock.


Bye.