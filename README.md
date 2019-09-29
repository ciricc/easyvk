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

### Captcha (Капча)
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

    /**
     * Делаем return, потому что иначе обращение к методу может ничего не вернуть!!
     * То есть Promise например vk.api.messages.send() ничего не получит!!!
     * 
     * */
    return vk.api.requestWithConfig(requestConfig);
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
### Двухфакторная аутентификация, подробный разбор
Для ловли двухфакторной аутентификации в EasyVK есть все те же хендлеры. Вообще это - идеальный пример, на мой взгляд как на самом деле работают хендеры в EasyVK, на сколько важно понимать, что должен возвращать хендлер и почему. Для разработки плагинов они всегда нужны.

На данный момент в библиотеке нет встроенных методов для быстрого решения двухфакторной аутентификации. Но возможно я что-нибудь такое напишу.

```javascript
const { 
  TwoFactorException, 
  VK, 
  APIException 
} = require('../easyvk');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let vk = new VK();

/** 
   Так вот незамысловато может выглядеть простейшая реализация ловли ошибки двухфакторной
   Возможно внутри библиотеки уже будут встроенны решения для подобных выкрутасов попроще
*/
const  stopTwoFactorProcessing = (exceptionHandlerPosition) (
  vk.removeExceptionHandler(exceptionHandlerPosition)
)

// Устанавливаем ловлю именно ошибки двухфакторной аутентификации
vk.handleException(TwoFactorException, (error, errorType) => {
  // Возвращаем промис, чтобы в итоге метод авторизации получил ответ. rl использует callback, мы - промисы
  return new Promise((resolve, reject) => {

    let twoFactorValidationWay = {
      '2fa_app': 'приложения',
      '2fa_sms': 'SMS'
    }
    
    twoFactorValidationWay = twoFactorValidationWay[error.validationType];
    
    // Обновляем конфигурацию запроса на поддержку двухфакторной аутентификации
    let requestConfig = {
      ...error.response.config,
      params: {
        ...error.response.config.params,
        '2fa_supported': true
      }
    }

    /** Функция для запуска "спрашивания" кода */
    function answerTheCode () {
      // СПрашиваем код
      rl.question(`Введите код из ${twoFactorValidationWay}: `, (answer) => {
        
        // Обновляем параметры
        requestConfig.params.code = answer.toString() //обязательно toString, мало ли что

        /**
          Так как может произойти такая ошибка, что код - не верный, мы тоже ставим обработчик
          на эту ошибку. позже мы его удалим, чтобы он больше не работал
          exceptionHandlerPosition сохраняет позицию хендлера в памяти, чтобы мы могли
          позже его удалить
        */
        let exceptionHandlerPosition = vk.handleExceptionFirstly(APIException, (error) => {
          // Если ошибка - неверный формат данных, то значит мы попали
          if (error.errorType === 'otp_format_is_incorrect') {
            console.log('Вы ввели неверный код!', answer);
            // Останавливаем текущий хендер
            stopTwoFactorProcessing(exceptionHandlerPosition);
            // Занова спрашиваем, с новыми запросом
            answerTheCode();
            return;
          } else {
            // Иначе это какая-то другая ошибка, возвращаем процессингу эту ошибку
            return error;
          }
        });

        // Делаем запрос снова, с новой конфигурацией
        return vk.api.withRequestConfig(requestConfig).then((res) => {
          // Если запрос успешно выполнен, то мы останавливаем чтение и возвращаем его ответ 
          // методу авторизации плагина Auth
          rl.close();
          resolve(res);
          return;
        }, reject).catch((e) => {
          // Тут может быть ошибка, останавливаем чтение строки из консоли
          rl.close();
          // Выкидываем исключение, чтобы ошибка продолжила переход
          throw e;
        });
      });
    }

    // Запускаем функцию, которая будет спрашивать код двухфактрной авторизации
    answerTheCode();
  });
});

// Запускаем установку плагинов, настраиваем плагин Auth
vk.setup({
  auth: {
    username: 'ИМЯПОЛЬЗОВАТЕЛЯ',
    password: 'ПАРОЛЬ'
  }
}).then(() => {
  const myToken = vk.auth.session.get('access_token');
  console.log(`token: ${myToken}`);
  // Получаем инфу о юзере
  vk.api.users.get().then(console.log);
});
```

#### Ловля одинаковых ошибок

Если вам нужно ловить не определенную ошибку, а все сразу, то вы можете указать в качестве `Exception` исключение `APIEception`

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