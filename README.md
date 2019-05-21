<p align="center">
  <img alt="EasyVK logo" title="EasyVK can help you create applications on VKontakte API easy!" src="https://i.imgur.com/5P6VNOq.png" width="300"/>
</p>

# EasyVK (VKontakte API Manager) v2.0

This library helps you easily create a javascript application with VKontakte API!
Official VK API: [vk.com/dev/](https://vk.com/dev/)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/cfce75d7342d487c8b8766b7d2085d1d)](https://www.codacy.com/app/ciricc/easyvk?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ciricc/easyvk&amp;utm_campaign=Badge_Grade) [![Build Status](https://travis-ci.org/ciricc/easyvk.svg?branch=master)](https://travis-ci.org/ciricc/easyvk) ![Downloads](https://img.shields.io/npm/dt/easyvk.svg?style=flat) ![Issues](https://img.shields.io/github/issues/ciricc/easyvk.svg?style=flat)
![Node version support](https://img.shields.io/node/v/easyvk.svg?style=flat) ![Npm version released](https://img.shields.io/npm/v/easyvk.svg?style=flat)

| [Community](https://vk.com/club162208999) | [Документация на русском](https://ciricc.github.io/) |
| ------------------------------------------| -------------|

## Для русскоязычных

Данная библиотека создана для того, чтобы VKontakte API имел удобную поддержу на node.js.
С помощью этой библиотеки вы можете делать все, что позволяет официально ВКонтакте API, и не только.
Так как я предполагаю, что большинство людей, кто скачивает - владеют русским с рождения, то я написал [документацию](https://ciricc.github.io/) для этого модуля на этом языке. 
Если вы хотите помочь в развитии этой библиотеки, вступайте в наше [сообщество](https://vk.com/club162208999) и предлагайте, что можно улучшить и добавить. 
Если вы хотите помочь нам кодом - делайте это на [github](https://github.com/ciricc/easyvk).
Ниже написано, что можно делать при помощи EasyVK.

## Installing

Download and install Node.js. Create a project and install `easyvk` with `npm`:

```sh
npm i easyvk --save
```

### Yarn installation
If you are using a yarn package manager, you can add easyvk to project so
```sh
yarn add easyvk
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
   save_session: false,
   reauth: true
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

## EasyVK can help you

*   <b> Create Bots </b>
*   Manage groups
*   Use LongPoll: <b>Bots LongPoll (groups) and User LongPoll</b>
*   Use <b>Callback API</b> (like creating your server to listen to group events)
*   Manage your stream based on official <b>Streaming API</b>, listen to events and collect data to create statistic and metrics
*   Upload your files to the server
*   Call official <b>VKontakte API methods</b>
*   Use my widgets - non-official instruments for everyday tasks
*   Use helpers - utility for creating something that you need everyday
*   Use saved session, cache data to saved session
*   Catch errors like Captcha error and others

## EasyVK provide

*   <b>Promises and async / await based library</b>
*   Authentication support: groups, users, applications, password + username
*   Informative documentation
*   Regular updates and support for newest features
*   Two factor authentication support

You can read documentation <a href="https://ciricc.github.io/">here</a>

## Рекомендации по производительности ботов
Чтобы Ваши боты работали еще быстрее, я рекомендую использовать не Bots Longpoll API, а обычный LongPoll API.
Обновление, которое повышает производтельность находится на версии 2.1.1, версии ниже работают в два раза медленнее, поэтому проверьте, какая версия у Вас установлена.

```javascript

easyvk({
  access_token: "{GROUP_TOKEN}",
  reauth: true
}).then(async (vk) => {
  
  let { connection } = await (vk.longpoll.connect());

  connection.on("message", (msg) => {

    let _msg = {
      out: msg[2] & 2,
      peer_id: msg[3],
      text: msg[5],
      payload: msg[6].payload
    }

    if (!_msg.out) {
      vk.call("messages.send", {
        peer_id: _msg.peer_id,
        message: "Hi!"
      })
    }

  });

});

```

## Что дает EasyVK

Узнайте, зачем Вам может понадобиться EasyVK, и что именно он может Вам дать!

### Плагины

Теперь в Easy VK будет поддерживаться разработка новых плагинов. В скором времени Easy VK значительно сильно изменит кодстайлинг, поэтому в Easy VK уже сейчас внедряются средства для разработчиков, чтобы каждый мог внести вклад в создание Easy VK. Функционал плагинов будет дополняться по мере просьб и нужд разработчиков, я всегда буду рад обновлениям функционала.

```javascript
  
  // Разработка простейшего плагина для отправки сообщений
  vk.use(async ({thread, next}) => {
    if (thread.method == "messages.send") {
      // Автоматически меняем типа запроса на POST
      thread.methodType = "post";

      if (Number(thread.query.v) >= 5.90) {

        /* Для новых версий API ВКонтакте для сообщений 
           требует поля random_id (уникальный id сообщения) */
        thread.query.random_id = 
          new Date().getTime().toString() + '' + (Math.floor(Math.random() * 1000)).toString() ; 
      }

    }

    // Запускаем следующий плагин
    await next();
  });

```

### Audio API

Вам нужны аудиозаписи для личного использования? EasyVK предлагает объект для работы с аудио.
Очень мощное Audio API, которое появилось в версии 2.0.0, практически полностью дублирует все методы из официальной документации Audio API, которое, к слову, уже закрыто, но в EasyVK работает.

```javascript
  
  vk.http.loginByForm({
    cookies: __dirname + "/mycookies.json"
  }).then(({client: Client}) => {
      
    //Получение аудиозаписей группы, например
    Client.audio.get({
      owner_id: -45703770,
      offset: 0,
      playlist_id: -1
    }).then(({vkr}) => {
      console.log(vkr);
    });
  
    //Загрузка файлов
    Client.audio.getUploadServer().then(({vkr}) => {
    
      let url = vkr.upload_url;

      Client.audio.upload(url, __dirname + '/main.mp3').then(({vkr}) => {
        
        vkr.title = 'Новое название';
        vkr.artist = 'Новый Артист';

        return Client.audio.save(vkr);

      }).then(({vkr}) => {
        console.log(vkr, 'saved audio');
      }).catch(console.error);

    });

  });

```

### Client Credentials Flow и авторизация по приложению

```javascript

  easyvk({
    client_id: '{APP_SECRET_CODE}',
    client_secret: '{CLIENT_SECRET_CODE}',
  }).then((vk) => {

    const StreamingAPI = vk.streamingAPI

    return StreamingAPI.connect().then(({connection}) => {

      connection.getRules().then(({vkr}) => {
        console.log(vkr.rules);
      });

      connection.on("post", console.log)

    });

  });

```

### Stories API

Используйте все возможности ВКонтакте.
С недавних пор в EasyVK существует возможнсть "просматривать" истории.

```javascript
  
  vk.http.loginByForm().then(({client: Client}) => {
    
    const user_id = 1;
    
    Client.readStories(user_id).then(({count, vk: EasyVK}) => {
      console.log(count + ` [;user_id = ${user_id}, stories count]`);
    });

    Client.readFeedStories().then(({count}) => {
      console.log(count + ' [feed stories]');
    });

  });

```

### LongPoll API

Создавайте своих чат-ботов с помощью EasyVK и его возможностей LongPoll API

```javascript
  
  //bots
  vk.bots.longpoll.connect({
    forGetLongPollServer: {
      grop_id: vk.session.group_id
    }
  }).then(({connection, vk: EasyVK}) => {
    
    connection.on("message_new", (msg) => {
      
      //On message event
      vk.call("messages.send", {
        peer_id: msg.from_id,
        message: "Reply it!"
      }).catch(console.error);

    });

  });

  //user longpoll
  vk.longpoll.connect({}).then(({connection}) => {
    connection.on("message", (event) => {
      console.log(event);
    });
  
    //changed state of message
    connection.addEventCodeListener(3, (eventChangeState) => {
      console.log(eventChangeState);
    });
  });


```

### Streaming API

Собирайте статистические данные о популярности тех или инных продуктов, проектов, чего угодно! Это позволит Вам знать, о чем пишут пользователи ВКонтакте, и кто Ваши клиенты!

```javascript
    
  vk.streamingAPI.connect(({connection: stream}) => {
      
      stream.initRules({
        key1: 'кошка',
        key2: 'собака -кот'
      }).then(({log: changes}) => {
        
        console.log(changes.changedRules, changes.deletedRules, changes.addedRules);

        stream.on("post", (postEvent) => {
          console.log("Post info: ", postEvent);
        });
        
        //.on(...)
        //.on("share")
        //.on("comment") etc...

      });

  });

```

### Callback API

Создавайте чат-ботов с помощью Callback API, имея собственный сервер с открытым доступом в интернете.

```javascript

  easyvk.callbackAPI.listen({
    port: process.env.PORT || 8080,
    groups: [
      {
        groupId: 11,
        confirmCode: 'TestConfirmationCode',
        secret: 'GroupPassword'
      },
      {
        /*....*/
      }
    ]
  }).then(({ connection }) => {
    
    connection.on('message_new', (msg) => {
        console.log(msg.group_id);
    });

  }).catch(console.error);

```
Все остальное находится на <a href="https://ciricc.github.io/">сайте-документации</a> проекта.