# Changelog

This file started from 0.2.8 version.
So, in older versions you need see changes in a commits.


## 2.0

### Добавленные методы (21):
+ easyvk.is(foor, obj2) - проверка объектов
+ easyvk.http.loginByForm() - исправлена проблема авторизации без пароля, не было проверки, что данные верны
+ httpClient.audio.get() - получить аудиозаписи группы или пользователя
+ httpClient.audio.getById() - получить несколько аудиозаписей по их ID,
+ httpClient.audio.search() - получить аудиозаписи по поисковому запросу
+ httpClient.audio.getCount() - получить количество аудиозаписей группы/юзера
+ httpClient.audio.getLyrics() - получить слова песни (старый способ)
+ httpClient.audio.getUploadServer() - получить URL Для загрузки аудио
+ httpClient.audio.upload() - загрузить аудиозапись
+ httpClient.audio.getURL() - получить разобранный URL аудиозаписи, Mp3
+ httpClient.audio.save() - сохранить загруженную аудиозапись, чтобы дальше ею манипулировать
+ httpClient.audio.add() - добавить аудиозапись
+ httpClient.audio.delete() - удалить аудиозапись с возможностью восстановить
+ httpClient.audio.reorder() - восстановить удаленную запись
+ httpClient.audio.edit() - редактировать аудиозапись
+ httpClient.audio.reorder() - переместить аудиозапись на другую позицию

#### —- ДЛЯ ПРОДВИНУТЫХ —
+ httpClient.audio._getAudioAsObject() - получение из массива аудиозаписи объекта аудиозаписи
+ httpClient.audio._parseResponse() - спарсить ответ сервера POST запроса вк, пока что не используется, но будет переписано на это
+ httpClient.audio._getAdi() - получение хешей для работы с аудио
+ httpClietn.audio._getNormalAudiosWithURL() - более массивный метод для получения сразу нескольких аудио из массива в объект
+ httpClient.audio._request() - сделать POST запрос на адрес vk.com/al_audio.php
+ httpClietn.audio._parseJSON() - спарсить JSON из ответа сервера, скоро будет удален ввиду переписи под метод parseResponse


### Исправленные баги:
- Исправлена ошибка авторизации по HTTP сессии без пароля и логина
- Исправлена ошибка объекта VKResponse, бывало, что он был пустым
- Исправлены ошибки метода parseJSON, в некоторых местах он не принимал основных аргументов
- Исправлена ошибка парсинга JSON из ответа сервера, когда тот в конце
- Исправлена ошибка пустых src аудиозаписей
- Исправлена ошибка загрузки аудиозаписи
- Исправлена ошибка несуществующего метода error() в HTTP клиенте

Добавленные объекты и свойства:
+ easyvk.http.audio - AudioAPI
+ AudioAPI.genres - жанры аудиозаписей
+ AudioAPI._authjar - JAR сессия HTTP клиента
+ easyvk.classes - названия внутренних классов EasyVK
+ AudioItem - объект аудиозаписи


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
