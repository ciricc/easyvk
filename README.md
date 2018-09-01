

<p align="center">
  <img alt="EasyVK logo" title="EasyVK can help you create applications on VKontakte API easy!" src="https://i.imgur.com/COiRjJL.png" width="200"/>
</p>

# EasyVK (VKontakte API Manager)

This library helps you easily create apps with vk api!
Official VK API: [vk.com/dev/](https://vk.com/dev/)

| [Community](https://vk.com/club162208999) | [Changelog](https://github.com/ciricc/easyvk/tree/master/CHANGELOG.md) | [Документация на русском](https://ciricc.github.io/) |
| ------------------------------------------| ---------------------------------------------|-------------|

## Для русскоязычных

Данная библиотека создана для того, чтобы VKontakte API имел удобную поддержу на node.js.
С помощью этой библиотеки вы можете делать все, что позволяет официально ВКонтакте API, и не только.
Так как я предполагаю, что большинство людей, кто скачивает - владеют русским с рождения, то я написал [документацию](https://ciricc.github.io/) для этого модуля на этом языке. 
Если вы хотите помочь в развитии этой библиотеки, вступайте в наше [сообщество](https://vk.com/club162208999) и предлагайте, что можно улучшить и добавить. 
Если вы хотите помочь нам кодом - делайте это на [github](https://github.com/ciricc/easyvk).
Ниже написано, что можно делать при помощи EasyVK.

## Installing

Download and install Node.js. Create a project and install `easyvk` with `npm`:

```
npm i easyvk --save
```

## Example usage

You can test the library without installing on [npm runkit](https://npm.runkit.com/easyvk).
Copy this code and paste it in the code area, don't forget to change username and password.

```javascript

var easyvk = require("easyvk")

//Authenticating user
easyvk({
   username: 'your_login',
   password: 'your_password',
   save_session: false
}).then(vk => {
  
   //Getting user id from authenticated session
   var me = vk.session.user_id || 356607530 //Or your account id
   
   //Sending a message using messages.send method
   vk.call('messages.send', {
      message: 'Hi',
      user_id: me
   }).then(({vkr}) => {})
   
}).catch(console.error)


```



## EasyVK can help you:

* <b>Create Bots</b>
* Manage groups
* Use LongPoll: <b>Bots LongPoll (groups) and User LongPoll</b>
* Use <b>Callback API</b> (like creating your server to listen to group events)
* Manage your stream based on official <b>Streaming API</b>,
  listen to events and collect data to create statistic and metrics
* Upload your files to the server
* Call official <b>VKontakte API methods</b>
* Use my widgets - non-official instruments for everyday tasks
* Use helpers - utility for creating something that you need everyday
* Use saved session, cache data to saved session
* Catch errors like Captcha error and others

## EasyVK provide:
* <b>Promises and async / await based library</b>
* Authentication support: groups, users, aplications, password + username
* Informative documentation
* Regular updates and support for newest features
* Two factor authentication support


You can read documentation <a href="https://ciricc.github.io/">here</a>
