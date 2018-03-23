# Changelog

This file started from 0.2.8 version.
So, in older versions you need see changes in a commits.


## [1.0] 

## Login

### in [0.3.12v]

```javascript

const VK = require('easyvk')

VK.login({
    access_token: '{TOKEN_FIELD}'
}).then(function (session) {
    //need know your id before start script
    const me = 1

    return VK.call('messages.send', {
        user_id: me,
        message: 'Hello!'
    })

}).catch(console.error)

```

### in [1.0v]

```javascript

const easyvk = require('easyvk')

easyvk({ //Login here
    access_token: '{TOKEN_FIELD}'
}).then((vk) => {
        return vk.call('messages.send', {
        user_id: vk.session.user_id,
        message: 'Hello!'
    })
}).catch(console.error)


```
## Streaming API

### in [0.3.12v]

```javascript

VK.streamingAPI({
    client_id: '222222',
    client_secret: 'wzkLEmKOlDflwaaWwdWM'
}).then(function (connection) {
    connection.on('post', function(post) {
        console.log(post)
    })	
})	

```

### in [1.0v]

```javascript

easyVK({

}).then(vk => {
    return vk.streamingAPI.connect({
        clientId: '222222',
         clientSecret: 'wzkLEmKOlDflwaaWwdWM'
    })
}).then(({ connection, vk }) => {

    connection.on('post', (post) => {
        console.log(post)
    })

}).catch(console.error)

```



## [0.3.12] - 2018-02-18

### Added 
- Added 2 parameter in callback function for StreamingAPI. Now, you can get access_token before WeSocket connection inited.

```javascript
  
  VK.streamingAPI({}).then(function(connection, session){
    console.log(session.access_token); //This token is not a user token, it's only for one connection
  });
  
```

## [0.3.11] - 2018-02-18

### Added
- Link on our community group
- Created our community group

### Changed
- api_v default parameter. Now is 5.73 version
- Readme file

## [0.3.1] 

### Changed
- Comments in scripts
- Corrected readme
- Corrected changelog

## [0.3.0]

### Added
- CallbackAPI support (tested on heroku server)
- package.json file, added must have node version

### Changed

- Fixed auth with group access token. VK APi was updated from uid to user_id 
- All functions like longpoll(), streamingAPI(), callbackAPI() now is asynchronous
- Changed api_v in README file (5.73)
- Fixed package.json

## [0.2.81]

### Changed
- Fixed video streaming error, when live stream there is no, but programmer try to get views. In older version it can throw error and stop your script. It solved.
- Removed "UUURAA!!" in console's  log

## [0.2.8]

### Added
- New event type for longpoll - close (Arises when connection closed by .close() method)

### Changed
- Fixed StreamingAPI. When you may be tried delete many rules, there was a mistake "vk response undefined". Now this problem solved and it works normal.
- Fixed api_v parameter. Previously, this parameter could not be changed, because of the shortcomings in the code. Now this problem solved.
- Fixed longpoll connection
- Fixed tests examples
- All quieries will be send with &v=api_v parameter (beacouse in febr of 2018, VK API was updated)
- VK API version on 5.71
