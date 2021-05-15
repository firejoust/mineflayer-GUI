import * as mineflayer from 'mineflayer';
import { plugin } from './index';

const options = {
    host: 'mezzamc.ga',
    username: 'nozzavevo@gmail.com',
    password: 'pizza101'
};

const bot = mineflayer.createBot(options);
const gui = new plugin(bot); // initialize the plugin

bot.once('login', async () => {
    bot.chat(`-----参りました。-----`);
    
    let status;
    try {
        status = await gui.retreiveItem('dirt');
        bot.chat(`/enderchest`);
    } catch (e) {
        bot.chat(`Error thrown: ${e.message}`)
    }

    if (status) {
        bot.chat(`Dirt found in echest`);
    } else {
        bot.chat('Error occured: retreiveItem() returned false.');
    }

    bot.chat(`-----終わりました。-----`);
});