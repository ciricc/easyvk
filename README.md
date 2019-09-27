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

### Переезд с версии 2

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