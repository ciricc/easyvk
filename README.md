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