### Easy VK v3.0

Находится в разработке. Документация временно не доступна и будет появляться по мере готовности проекта

```javascript
const VK = require('easyvk');


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
const VK = require('easyvk');
let vk = new VK();
vk.setup({
    auth: {
        token: 'ТОКЕН_ГРУППЫ'
    }
}).then(() => {
    vk.messages.send({
        peer_id: 1,
        message: "Привет!"
    }).then(console.log);
});
```