### Easy VK v3.0

Находится в разработке. Документация временно не доступна и будет появляться по мере готовности проекта

```javascript
const {VK} = require('easyvk');


let vk = new VK({
  mode: 'highload'
});

// Настраиваем все плагины
vk.setup({
  auth: {
    token: 'my_token'
  }
}).then(() => {
  vk.api.groups.getById().then((res) => {
    console.log(res[0]);
  });
});

```

### Переезд со 2 версии

Чтобы сделать мягкий переезд, вам нужно помолиться. Потому что 3 версия координально отличается от 2, придется менять очень многое

### 2.5.1
```javascript
const easyvk = require('easyvk');
easyvk({
  access_token: 'ТОКЕН_ГРУППЫ'
}).then(vk => {
  vk.call("messages.send", {
    peer_id: 1,
    message: "Привет!"
  }).then(({vkr}) => {
    console.log(vkr);
  });
});
```

### 3.0
```javascript
const {VK} = require('easyvk');
let vk = new VK();
vk.setup({
  auth: {
    token: 'ТОКЕН_ГРУППЫ'
  }
}).then(() => {
  vk.api.messages.send({
    peer_id: 1,
    message: "Привет!"
  }).then(console.log);
});
```
### Работа с авторизацией и сессией

Для работы с авторизацией внутри библиотеки уже встроен плагин `Auth`, который поможет разобраться в авторизации. Внутри него есть уже встроенный механизм сессий, который работает на плагине `Storage`

```javascript
import VK from 'easyvk';

let vk = new VK({});

vk.setup({
    auth: {
        username: '',
        password: 'wdwd',
        sessionFile: '.session',
        reauth: false,
        fields: ['city']
    }
}).then(() => {

    let myToken = vk.auth.session.get('access_token);
    let myUserId = vk.auth.session.get('user_id');
    let myCity = vk.auth.session.get('fields').city;
    
    console.log(`Пользователь id${myUserId} живет в ${myCity} и владеет следующим токеном: ${myToken}`);
});

```

### Работа с плагином Storage
Данный плагин предназначен для создания каких-либо хранилищ данных в формате JSON. Либо это может быть оперативная память, либо файл. Данный плагин бует еще дорабаотываться, потому что много чего не доделано.

```javascript
import VK from 'easyvk';

let vk = new VK();
vk.setup().then(() => {
    // Олды тут
    let olds = [{
        first_name: 'Максим',
        last_name: 'Великий',
        user_id: 4512
    }, {
        first_name: 'Рамиль',
        last_name: 'Дажиев',
        user_id: 34068632
    }];

    vk.storage.createStorage('olds', olds);

    olds = vk.storage.get('olds');
    
    olds.update([{
        first_name: 'Виталий',
        last_name: 'Касаткин',
        user_id: 384578342
    }]);

    console.log(olds);
});
```

### Ловля ошибок

И вот тут начинается непойми что. Но вот так ловятся ошибки

```javascript
import {CaptchaException, VK} from 'easyvk';

let vk = new VK();

// Ловим ошибку капчи
vk.handleException(CaptchaException, (error:CaptchaException) => {
    let captchaKey = await getCaptchaKey(error.captchaImg); // Допустим, где-то мы получили код ошибки
    let requestConfig = error.response.config; // Берем конфигурацию из запроса Axios
    
    requestConfig.params = {
        ...requestConfig.params,
        captcha_sid: error.captchaSid,
        captcha_key: captchaKey
    }

    // Сдлаете вот так - return vk.api.withRequestConfig(); - 
    // не допускаете случаев, когда будет бесконечная рекурсия с обратным долгим выходом

    // Повторяем запрос (тут тоже возможна рекурсия, но не блокирующая)
    vk.api.withRequestConfig(requestConfig);
});

// Получаем список хендлеров
console.log(this.exceptionHandlers(CaptchaException)) // [Function: ExceptionHandler]

vk.setup({
    auth: {
        username: '',
        password: ''
    }
});

```

#### Ловля одинаковых ошибок

Если вам нужно ловить не определенную ошибку, а все сразу, то вы можете указать в качестве `Exception` искючение `APIEception`

```javascript
import {APIException, HaveBanException, VK} from 'easyvk';

let vk = new VK();

vk.handleException(HaveBanException, (error) => {
  console.log('Handled ban error!');
});

vk.handleException(APIException, (error) => {
  console.log('Handled API error');
})

```

Таким образом, в данном примере, если аккаунт заблокирован, будет вызвана всего лишь одна ошибка, но она вызовет сразу несколько Handler'ов, потому что ошибка блокировки - это ошибка API. То есть они равнозначны.

### Разработка плагинов

Знаю, что пока еще много чего нужно. Но то, что уже есть

```javascript
const {VK, Plugin} = require('easyvk');

class MyVersionManagerPlugin extends Plugin {
  constructor (vk, options) {
    super(vk, options);
    
    this.options = {
      ...this.options,
      v: '5.105',
      ...options
    }

    this.name = 'versionManager';

    this.setupAfter = "auth";
    this.requirements = ["auth"];
  }

  onEnable (options) {
    this.options = {
      ...this.options,
      ...options
    }
    
    // Выставляем значения по умолчанию
    this.changeVersion(this.options.v);

    // Подключаем сам плагин для быстрого доступа
    this.vk.link(this.name, this);

    return true;
  }

  changeVersion (v) {
    this.vk.defaults({v});
  }
}

let vk = new VK();

// Тут мы только добавляем плагин
vk.extend(MyVersionManagerPlugin).then(() => {
  // Тут устанавливаем ВСЕ плагины
  vk.setup({
    versionManager: {
      v: '5.101'
    },
    auth: {
      token: 'ТОКЕН'
    }
  }).then(() => {
    // Тут уже после установки
    vk.api.group.getById().then(console.log);

    // Тут мы меняем версию
    vk.versionManager.changeVersion('5.1');
    vk.api.groups.getById().then(console.log);
  });
});

```