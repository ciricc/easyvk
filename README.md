

<p align="center">
  <img alt="EasyVK logo" title="EasyVK can help you create applications on VKontakte API easy!" src="https://i.imgur.com/COiRjJL.png"/>
</p>

# EasyVK (VKontakte API Manager)

This app helps you create an apps with vk api easy!
You can use it for know more: [vk.com/dev/](https://vk.com/dev/)

| [Community](https://vk.com/club162208999) | [Changelog](https://github.com/ciricc/easyvk/tree/master/CHANGELOG.md) | [Документация на русском](https://ciricc.github.io/) |
| ------------------------------------------| ---------------------------------------------|-------------|

## Для русскоязычных

Данная библиотека создана для того, чтобы VKontakte API имел удобную поддержу на node.js.
С помощью этой библиотеки вы можете делать все, что позволяет официально ВКонтакте API, и не только.
Так как я предполагаю, что большинство людей, кто скачивает - владеют русским с рождения, то я написал [документацию](https://ciricc.github.io/) для этого модуля на этом языке. 
Если вы хотите помочь в развитии этой библиотеки, вступайте в наше [сообщество](https://vk.com/club162208999) и предлагайте, что можно улучшить и добавить. 
Если вы хотите помочь нам кодом - делайте это на [github](https://github.com/ciricc/easyvk).
Ниже написано, что можно делать при помощи EasyVK.

## Usage

You need download Node.js and install it with npm manager. Then you need create your project and install easyvk so.

```
npm i easyvk --save
```

## Test in browser code (Example usage)

You can test library in the browser of [npm runkit](https://npm.runkit.com/easyvk).
You need copy this code and paste it in the area code, changed your parameters

```javascript

var easyvk = require("easyvk")

//Authenticate user
easyvk({
   username: 'your_login',
   password: 'your_password',
   save_session: false
}).then(vk => {

   const me = 356607530 //Or your account id
   
   vk.call('messages.send', {
      message: 'Hi',
      user_id: me
   }).then(vkr=>{})
   
}).catch(console.error)


```



# EasyVK can help you...

* <b>Create Bots</b>
* Manage groups
* <b>LongPoll listen, Bots LongPoll (groups), User LongPoll</b>
* <b>Callback API</b> support, create your server and listen group events
* You can create your stream based on official <b>Streaming API</b> platform,
  listen events, collect data for create statistic and metrics
* You can upload your files on the server
* You can call to  official <b>VKontakte API methods</b>
* You can use my widgets - not official instruments for do evereyday something
* You can use helpers - utility for create something that you need everyday 
* You can use saver session, use session for cache data
* Catching errors like Captcha error and others
* <b>Promises, async / await based library</b>
* Authentication suport: groups, users, aplications, password / username
* Informative documentation
* Regulary updates and support for the newest features
* Two factor authentication support


You can read documentation of this library <a href="https://ciricc.github.io/en_index.html">here</a> (English) and <a href="https://ciricc.github.io/">here</a> (Русская версия документации)