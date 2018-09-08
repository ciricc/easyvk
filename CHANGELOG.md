# Changelog

This file only holds the changelog from version 0.2.8.
For older versions see commits.


## [1.0] 

## Login

### in [0.3.12v]

```javascript

const VK = require('easyvk')

VK.login({
    access_token: '{TOKEN_HERE}'
}).then(function (session) {
    //Insert your id here
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
    access_token: '{TOKEN_HERE}'
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
- Added 2 parameters to callback function for StreamingAPI. Now you can get `access_token` before WebSocket connection is initiated.

```javascript
  
  VK.streamingAPI({}).then(function(connection, session){
    console.log(session.access_token); //This token is not a user token, it's for streamingAPI and is temporary
  });
  
```

## [0.3.11] - 2018-02-18

### Added
- Link to our community group

### Changed
- Created our community group
- `api_v` default value is now `5.73`
- Readme file

## [0.3.1] 

### Changed
- Added comments to scripts
- Corrected readme
- Corrected changelog

## [0.3.0]

### Added
- CallbackAPI support (tested on heroku server)
- Added node version to `package.json` file

### Changed

- Fixed auth with group access token. VK API replaced `uid` with `user_id` 
- All functions like `longpoll()`, `streamingAPI()`, `callbackAPI()` are now asynchronous
- Changed `api_v` in README file (5.73)
- Fixed `package.json`

## [0.2.81]

### Changed
- Fixed video streaming error, when there is no live stream, but it tries to get the views. In older versions it could throw an error and crash. It's solved.
- Removed "UUURAA!!" from the log

## [0.2.8]

### Added
- New event type for longpoll - close (Emitted when connection is closed by the `.close()` method)

### Changed
- Fixed StreamingAPI. When you try to delete many rules, there was an error "vk response undefined". Now this problem is solved and it works normally.
- Fixed api_v parameter. Previously, this parameter could not be changed, because of the shortcomings in the code. Now this problem is solved.
- Fixed longpoll connection
- Fixed tests examples
- All quieries will now be sent with `v=api_v` parameter (beacouse in febr of 2018, VK API was updated)
- VK API version 5.71
