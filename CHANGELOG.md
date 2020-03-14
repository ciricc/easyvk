# Изменения

Все доступные изменения, начиная с <b>2.1.1</b> версии
## \[2.6.0\] - Не вышла

### Новое

- Добавлен метод `vk.uploader.upload()` для максимально упрощенной загрузки файла на сервер

```javascript
vk.uploader.upload({
  getUrlMethod: "photos.getMarketAlbumUploadServer",
  getUrlParams: {
    group_id: 1
  },
  saveMethod: "photos.saveMarketAlbumPhoto",
  saveParams: {
    group_id: 1,
    // server, hash подставятся автоматически
  },
  file: 'https://vk.com/images/community_50.png',
  isWeb: true
})
```

- Добавлена поддержка `captchaHandler` в HTTP Клиенте
- Добавлен статический метод `easyvk.static.randomId()` для генерации случайного числа специально для отправки сообщений.
- Добавлена поддержка двухфакторной аутентификации для HTTP Клиента
```javascript
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function loginByFormWithTwoFactorSupport (code='') {
  return vk.http.loginByForm({
    cookies: './cookies',
    reauth: true,
    code
  }).catch(e => {
    if (e.is2fa) {
      return new Promise((resolve, reject) => {
        rl.question(`Введите ключ авторизации `, (key) => {
          return loginByFormWithTwoFactorSupport(key).then(resolve).catch(reject)
        })
      })
    } else {
      throw e;
    }
  })
}

let client = await loginByFormWithTwoFactorSupport();
```

```javascript
vk.call('messages.send', {
  peer_id: 1,
  message: "Привет!",
  random_id: easyvk.randomId()
})
```

- Добавлена настройка `clear` для очищения сессии после иницализации.
- В `easyvk.class` добавлен новый класс - `EasyVKError`


### Изменения

- Библиотека теперь работает на основе модуля `node-fetch`, все комопненты переписаны на нее. 
- Пожалуй, самое важное изменение этого обновления - отказ от скобок в ответах почти всех промисов библиотеки.

#### Было

```javascript
let {vkr: res} = await vk.call('users.get')
```

#### Стало

```javascript
let res = await vk.call('users.get')
```

Изменения коснулись всех компонентов, поэтому проверяйте обновленную документацию, если у вас что-то не получается

#### Было

```javascript
let {connection} = await vk.bots.longpoll.connect()
```

#### Стало

```javascript
let connection = await vk.bots.longpoll.connect()
```
- В настройках `easyvk` изменились названия параметров. Обратная совместимость пока что поддерживается, но рекомендую перейти на новые имена настроек


| Было | Стало |
|--------------|--------|
| access_token | token |
| api_v | v |
| save_session | save |
| session_file | sessionFile |
| captcha_sid  | captchaSid  |
| captcha_key  | captchaKey  |
| client_secret | clientSecret |
| client_id    | clientId |
| clean_session | clear |


- В связи с трудной поддержкой, в HTTP Клиенте удален класс для работы Audio API. Теперь Audio API не поддерживается библиотекой

- По скольку Audio API удален, а я предполагаю, что все-таки кому-то что-то нужно делать, и неофициально, то я сделал метод `client.request()` публичным и задокументировал его на сайте-документации. Он стал работать проще, логичнее и стабильнее.

- В методе `client.request()` теперь ответ будет возвращаться в JSON. Если в ответе нет JSON, то он вернет оригинальную строку `body`.

- В HTTP Клиенте убрана проверка авторизации. Теперь проблемы лимита атворизаций не будет. <b>Но в своих приложениях рекомендуется делать собственные проверки пароля и логина, через официальный API </b>

- HTTP Клиент теперь настраивается независимо от основной функции-инициализатора. То есть, у него появились собственные параметры и настройки, такие как `captchahandler`, `username`, `password`, `reauth` и другие

- Теперь, настраивая Callback API, вы можете кастомизировать работу сервера. То есть теперь не `easyvk` создает инстанс `express`, а вы, собственноручно. Это позволит вам изменять работу сервера как вам угодно и анализировать трафик.

```javascript
const express = require('express');
const app = express();

let connection = await easyvk.callbackAPI.listen({
  port: process.env.PORT || 8080,

  groupId: 1,
  secret: 'SecretCodeForGroupOrJustPassword',
  confirmCode: 'TestConfirmationCode',
  app
})

```
- Теперь статические методы дублируются в верхнем уровне объекта `Auth` (easyvk)

```javascript
async function reply (event, replyText="") {
  return vk.call('messages.send', {
    peer_id: event.peer_id,
    message: replyText,
    random_id: easyvk.randomId() // Ранее это было бы просто easyvk.static.randomId()
  }).catch(console.error)
} 

let res = await reply(event, "Hello!");

```

### Исправления

- Исправлена ошибка, из-за которой в `highload` режиме не всегда возвращался ответ (он был равен `empty`)
- В Callback API исправлено отсутствие информации об ошибке, когда в запросе не приходит `group_id`
- Исправлена ошибка Callback API, когда он работал без инициализации `easyvk`
- В некоторых местах исправлен ненужный вызов debug'ера
- В HTTP Клиенте исправлена работа метода `client.readStories()` и `client.readFeedStories()`
- Исправлена работа метода `vk.widgets.getLiveViews()`
- Исправлена работа `captchaHandler`, в некоторых ситуациях он не работал
- Файл `evkerrors.json` теперь перестал быть `.json` файлом и стал просто `.js` модулем.
Ранее на некоторых серверах могла возникнуть ошибка из-за отсутствия прав доступа для открытия этого файла, поэтому пришлось отказаться от этого способа работы библиотеки.
- В режиме `highload` исправлена ошибкак ловли капчи, раньше капча ловилась, но после ее обработки ответ не возвращался.
- В Streaming API исправлена работа с методом `stream.initRules()`. Раньше, если функция `callbackError` не была передана, возникала очень непонятная ошибка.


## \[2.5.1\] - 2019-06-26
### Hotfix
-  Исправлена работа авторизации группы по токену, ошибка `Group authorization failed: method is unavailable with group auth`

### Добавления и изменения
Всвязи с хотфиксом, в библиотеку добавлен новый параметр для настройки - `authType`.
Данный параметр отвечает за строгое указание по какому методу вести авторизацию через `access_token`, чтобы избежать неожиданных багов подобно тому, что появился сегодня.

```javascript
const easyvk = require('easyvk')

easyvk({
  access_token: 'token',
  authType: easyvk.GROUP_AUTH_TYPE
}).then(vk => {
  console.log(vk.session)
})
```

Его доступные значения: 
```javascript
[
  easyvk.USER_AUTH_TYPE, // Авторизация пользователя по токену
  easyvk.GROUP_AUTH_TYPE, // Авторизация группы по токену
  easyvk.APPLICATION_AUTH_TYPE // Авторизация приложения по сервисному токену
]
```

Значение обязательно должно находится из доступных в Easy VK
```javascript
console.log(easyvk.authTypes.indexOf('group') !== -1) // true
console.log(easyvk.authTypes.indexOf('my_very_good_token_type') !== -1) // false
```

## \[2.5.0\] - 2019-06-08
### Добавления и изменения
-  Добавлены новые методы Audio API:

*  `Audio.toggleAudioStatus()` - переключение статуса аудио (кнопка "транслировать в статус")
```javascript
client.audio.toggleAudioStatus({
  raw_audio_id: '-2001233579_9233579',
  enable: true // вкл/выкл
}).then(({vkr}) => {
  console.log('Audio toggled!', vkr)
}).catch(console.error)
```
*  `Audio.changeAudioStatus()` - переключение прослушиваемого трека в статусе
```javascript
client.audio.changeAudioStatus({
  raw_audio_id: '-2001233579_9233579'
}).then(({vkr}) => {
  console.log(vkr)
}).catch(console.error)
```
*  `Audio.getRecommendations()` - получить рекомендации для пользователя
```javascript
client.audio.getRecommendations({
  owner_id: vk.session.user_id
}).then(({vkr}) => {console.log(vkr)}).catch(console.error)
```
*  `Audio.getFriendsUpdates()` - получить обновления (треки) друзей
```javascript
client.audio.getFriendsUpdates({
  owner_id: vk.session.user_id
}).then(({vkr}) => {
  console.log(vkr.length)
}).catch(console.error)
```
*  `Audio.getNewReleases()` - получить новинки и чарты + рекомендации (разделы с главной страницы)
```javascript
client.audio.getNewReleases().then(({vkr}) => {
  console.log('Charts:', vkr.charts)
  console.log('Recommendations:', vkr.recoms)
  console.log('New tracks:', vkr.new)
}).catch(console.error)
```
-  Добавлены методы `client.goDesktop()` и `client.goMobile()` для переключения между мобильной и десктопной версией (для больших возможностей)
-  Добавлен метод `uploader.uploadFetchedFile()` для загрузки файлов с других источников (например, из гугл-картинок)
```javascript
easyvk({...}).then(vk => {
  vk.uploader.getUploadURL('docs.getUploadServer').then(({url}) => {
    vk.uploader.uploadFetchedFile(url, 'https://vk.com/images/community_100.png').then(({vkr}) => {
      let { file } = vkr;

      console.log(file) // Загруженный файл, далее docs.save -> messages.send

    }).catch(console.error)

    vk.uploader.uploadFetchedFile(url, {
      url: 'https://vk.com/images/community_100.png',
      name: 'camera.png' // Для файлов, в URL которых нет четкого обозначения расширения
    }).then(({vkr}) => {
      let { file } = vkr;

      console.log(file) // Загруженный файл, далее docs.save -> messages.send

    }).catch(console.error)
  }).catch(console.error)
})
```
- Параметр `fieldName` для загрузки файла теперь по умолчанию обозначен как `file`
- Кодировка в HTTP клиенте теперь настраивает произвольно, а также в нем появились новые возможности для метода `client.request()` (для расширения возможностей Easy VK, не документируется)

### Исправления
- Исправлена работа метод `Audio.reorder()`

## \[2.4.13\] - 2019-05-20
### Исправления
-   Исправлена ошибка работы `http(s)` прокси при включенной авторизации по логину и паролю

## \[2.4.12\] - 2019-04-28
### Исправления
-   Исправлена работа метода `HTTPClient.readStories()`
-   Исправлена работа переавторизации
-   Исправлена работа `highload` режима. Теперь будет видно полное описание ошибки
-   Исправлена работа debugger'а в секции `vk.call` при включенном `highload`. Теперь все запросы точно будут доходить до него 

## \[2.4.11\] - 2019-04-24
### Исправления
-   Исправлена кодировка GET запросов на `utf8`
-   Исправлена авторизация по сохраненной сессии приложений

## \[2.4.1\] - 2019-04-17
### Исправления
-   Исправлена работа с капчей при авторизации по сессии. Ранее капча могла не обрабатывалась через `captchaHandler` в кейсах, когда данные авторизации не менялись и не происходило `reauth: true`

## \[2.4.0\] - 2019-04-08
### Исправления
-   Исправлена работа режима `highload` при ошибке капчи. Теперь капча будет обрабатываться самым последним отправленным запросом из очереди
```javascript
easyvk({...{
  mode: 'highload'
}}).then(vk => {
  for (let i = 0; i < 100; i++) {
    vk.call('messages.send', {
      peer_id: 356607530,
      message: 'Дароу!'
    }).catch(e => {
      console.log(e, i);
    });
  }
});
````
-   Исправлена работа Bots LongPoll при неизвестной ошибке ВК (неожиданный ответ), теперь Easy VK самостоятельно сделает переподключение при остановке в таком случае
-   Исправлена авторизация из сессии
-   Исправлена работа метода `client.readFeedStories()` для прочтения историй со стены

### Добавления и изменения
-   Добавлена работа с `fs.ReadStream` для метода `uploader.uploadFile`. Теперь кроме имени файла можно передавать объект `ReadStream`
```javascript
const fs = require('fs')
const path = require('path')

easyvk({... {
  utils: {
    uploader: true
  }
}}).then(vk => {
  vk.uploader.getUploadURL('docs.getUploadServer').then(({url}) => {
    
    let stream = fs.createReadStream(path.join(__dirname, 't.txt'))
    
    vk.uploader.uploadFile(url, stream, 'file').then(({vkr}) => {
      console.log(vkr);
    }).catch(console.log)

  })
})

```
-   Для `static` методов добавлен новый метод `static.createExecute()`

Метод создает строковое представление запроса для VK Script
```javascript
easyvk.static.createExecute('messages.send', {
  peer_id: 1,
  v: '5.90',
  lang: 'en'
}) // 'API.messages.send({"peer_id": 1})'
```
-   Добавлен новый объект (переписанный старый) `Debugger`, теперь дебагинг всех запросов и их ответов возможен с помощью него <b>В следующих обновлениях все методы, связанные с работой прошлого Debugger'а, в том числе и DebuggerRun, будут удалены (сейчас об этом идет предупреждение)</b>
```javascript
const easyvk = require('easyvk');

const { Debugger } = easyvk;

let debug = new Debugger();

debug.on('response', ({ body }) => {
  console.log(body);
});

debug.on('request', (b) => {
  console.log(b.toString());
});

debug.on('request', ({ method, url, query }) => {
  console.log(`[${method}] on ${url}: \n`, query);
});

easyvk({
  debug,
  username: '...',
  ...{}
}).then(async vk => {

  let { vkr: friends } = await vk.call('friends.get');

  console.log('Got friends!', friends);

});

```
-  В связи с новым способом дебагинга, был добавлен новый параметр `debug`, куда необходимо передавать объект дебагера
-  Добавлена автоматическая "переавторизация", если изменены какие-то данные в настройках easyvk. Это убирает большинство типичных проблем, с которыми сталкивались разработчики ранее
-  В связи с исправлениями переавторизации, были добавлены новые поля сессии
<b>Для аккаунта</b>
```javascript
{
  username: 'имя_пользователя'
}
```
<b>Для приложений</b>
```javascript
{
  client_id: parseInt('233_ID_приложения', 10)
}
```
<b>Для групп ничего не изменялось, проверка идет по access_token'у</b>

## \[2.3.0\] - 2019-03-17
## Исправления
-   Исправлен `captchaHandler` для авторизации. Теперь капча поступает сразу в handler. Раньше можно было ловить капчу при авторизации только с помощью `.catch()` метода
-   Исправлена кодировка методов `Audio.get()` и `Audio.search()`
-   Исправлена функция декодирования Mp3 URL, были внесены последние обновления с сайта ВКонтакте
-   Исправлена ошибка поиска аудиозаписей
-   Исправлена ошибка закрытых аудиозаписей. Ранее Easy VK не возвращал аудиозапись, к которой закрыт доступ правообладателем или самой платформой. Теперь стало возможно получить аудиозапись, а вместе с этим, у таких аудиозаписей появились два новых поля - `is_restriction` и `extra` (несет в себе JSON информацию о причине блокировке аудио)

## Добавления
-  Были добавлены два новых поля для аудиозаписей: `is_restriction` и `extra`, которые дают знать, заблокирован ли трек и если да, то по какой причине
-  Был добавлен режим `highload`, который позволяет отправлять все запросы к API через метод `execute`. Его настройка максимально точна и проста.
```javascript
const easyvk = require('easyvk')

easyvk({
  access_token: '{ТОКЕН_ГРУППЫ}',
  mode: 'highload' || { // Можно настроить режим точнее
    // Имя режима работы. Пока что только одно
    name: 'highload',

    // Время, через которое запрос гарантированно выполнится, если не поступит новых
    timeout: 15
  },
  api_v: '5.80', // Все запросы будут выполнятся под этой версией
  lang: 'en' // Все запросы будут возвращать в едином языке - English
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
-   Была добавлена возможность настроить утилиты и компоненты, которые вы теперь можете отключить за ненадобностью, или, наоборот, подключить, если Easy VK их автоматически отключил

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