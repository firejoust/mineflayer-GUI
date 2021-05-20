const mineflayer = require('mineflayer');
const bot = mineflayer.createBot({
    host: ``,
    port: 25565,
    username: ``,
    password: ``,
    version: `1.16.5`,
});

bot.once(`login`, () => {
    console.log(`bot logged in`);
    setTimeout(() => console.log(bot.inventory.slots[44]), 10000);
});