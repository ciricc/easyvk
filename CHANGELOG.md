# Изменения

Все доступные изменения, начиная с <b>2.1.1</b> версии
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