# Easyvk (VK API Manager)

This app helps you create an apps with vk api easy!
You can use it for know more: vk.com/dev/manuals

|[All examples](https://github.com/ciricc/easyvk/tree/master/tests) | [Example (bot)](https://vk.com/sayme_bot) |
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

I recommend that you install 0.1.1 version. Then this readme will actual. Or you can got an error(s).
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
| api_v | My SDK uses now 5.69 API (2017) version but you can change it | 5.69 |

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

For now my SDK can very little, but if you help me with ideas, i create new features and write code!
So, ....



## What's next? (0.2.0?)

In next versions i will add upload all types of files (documents, photos, audio etc)
Working with products. And little functions like isFriend(), isMember() and other.
It will be cool, guys! And you can help me with crete it: vk.com/kinock.


Bye.