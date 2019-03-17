# Изменения

Все доступные изменения, начиная с <b>2.1.1</b> версии
## \[2.2.18\] - 2019-03-17
## Исправления
-   Исправлен `captchaHandler` для авторизации. Теперь капча поступает сразу в handler. Раньше можно было ловить капчу при авторизации только с помощью `.catch()` метода
-   Исправлена кодировка методов `Audio.get()` и `Audio.search()`
-   Исправлена функцию декодирования Mp3 URL, были внесены последние обновления с сайта ВКонтакте
-   Исправлена ошибка поиска аудиозаписей
-   Исправлена ошибка закрытых аудиозаписей. Ранее Easy VK не возвращал аудиозапись, к которой закрыт доступ правообладателем или самой платформой. Теперь аудиозапись стало возможно получить, а вместе с этим у таких аудиозаписей появились два новых поля - `is_restriction` и `extra` (несет в себе JSON информацию о причине блокировке аудио)

## Добавления
-  Были добавлены два новых поля для аудиозаписей: `is_restriction` и `extra`, которые дают знать, заблокирован ли трек и если да, то по какой причине
-  Был добавлен режим `highload`, который позволяет отправлять все запросы к API через метод `execute`. Его настройка максимально точна и проста.
```javascript
const easyvk = require('easyvk')

easyvk({
  access_token: '{ТОКЕН_ГРУППЫ}',
  mode: 'highload' || { // Можно натсроить режим точнее
    // Имя режима работы. Пока что только одно
    name: 'highload',

    // Время, через которое запрос гарантированно выполнится, если не поступит новых
    timeout: 15
  },
  api_v: '5.80', // Все запросы будут выоплнятся под этой версией
  lang: 'en' // Все запросы будут возвращать единый язык - English
}).then(async (vk) => {

  // Подключение к LongPoll происходит тоже через execute метод
  let {connection: group} = await vk.longpoll.connect()

  group.on("message", async (msg) => {
    
    let _msg = {
      out: msg[2] & 2,
      peer_id: msg[3],
      text: msg[5],
      payload: msg[6].payload
    }
    
    if (!_msg.out) {
      
      let {vkr} = await vk.call('messages.send', {
        message: "Hello!",
        peer_id: _msg.peer_id
      });

      console.log(vkr);
    }

  })

})
```
-   Была добавлена возможность настройки утилит и компонентов, которые вы теперь можете отключить за ненадобностью, или, наоборот, подключить, если Easy VK их автоматически отключил

```javascript

const easyvk = require('easyvk')

easyvk({
  access_token: '{ТОКЕН_ГРУППЫ}',
  utils: {
    http: true,
    widgets: true,
    bots: false, // Отключаем секию vk.bots
    uploader: true, // Включаем Uploader
    longpoll: true, // Включаем User LongPoll
    callbackAPI: true, // Callback API изначально выключен, его мы подключаем сами
    streamingAPI: true // То же самое
  }
}).then(async (vk) => {

  // Подключение к LongPoll происходит тоже через execute метод
  let {connection: group} = await vk.longpoll.connect()

  group.on("message", async (msg) => {
    
    let _msg = {
      out: msg[2] & 2,
      peer_id: msg[3],
      text: msg[5],
      payload: msg[6].payload
    }
    
    if (!_msg.out) {
      
      let {vkr} = await vk.call('messages.send', {
        message: "Hello!",
        peer_id: _msg.peer_id
      });

      console.log(vkr);
    }

  })

})

```

## \[2.2.17\] - 2019-03-10
## Исправления
-   Исправлен метод HTTP клиента audio.get() для большого количества аудиозаписей (больше 200) с помощью добавления параметра `count` - количество максимально обрабатываемых аудиозаписей. Ранее обрабатывались все получаемые аудио (без ограничения, т.к ВК возвращает почти все треки)

```javascript
let { client } = await vk.http.loginByForm()

client.audio.get({
  count: 150,
  offset: 30,
  owner_id: -45703770
}).then(({vkr}) => {
  
  console.log(vkr.length)

})
```
## \[2.2.16\] - 2019-02-22
## Исправления
-   Исправлена отправка post запроса
-   Исправлена работа с прокси на более новых версиях Node.JS

## \[2.2.14\] - 2019-02-09
### Добавления
-   Добавлен параметр <code>userAgent</code> для запросов <code>vk.call()</code>
```javascript
const easyvk = require('easyvk')

easyvk({
  userAgent: 'KateMobileAndroid/52.2.2 lite-448 (Android 6.0; SDK 23; arm64-v8a; alps Razar; ru)',
  access_token: 'USER_TOKEN',
  reauth: true
}).then(async (vk) => {
  let {vkr: audios} = vk.call("audio.get")

  console.log(audios.items.length)
})
```

### Исправления
-   Исправлена отправка post запроса через метод vk.post()

## \[2.2.13\] - 2019-02-04
### Изменения
-   Возвращена поддержка Node JS >= 8.0.0

## \[2.2.12\] - 2019-02-03
### Добавления
-   Добавлен файл CHANGELOG.md

## \[2.2.1\] - 2019-02-03
### Добавления
-   Добавлен метод поиска множества аудиозаписей сразу 
```javascript
let { client } = await vk.http.loginByForm()
let count = 1000 // Если аудиозаписей меньше, вернет полученное количество

client.audio.searchAll(query, count).then(console.log)
```

### Исправления
-   Исправлена ошибка авторизации при <code>save_session: false</code>

### Изменения
-   В Streaming API теперь событие pullEvent будет доступно, даже если нету слушателей на это событие. Таким образом, можно будет слушать все события с помощью одного.