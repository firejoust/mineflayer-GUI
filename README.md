<h1 align="center">mineflayer-GUI</h1>
<p align="center"><i>A mineflayer plugin enabling for easy management of inventory/chest/etc GUIs</i></p>

## Installation
- This plugin requires npm to install:
```
npm install mineflayer-gui
```

## Example
```js
const mineflayer = require(`mineflayer`);
const mineflayer_gui = require(`mineflayer-gui`);

const options = {
  username: `botty`,
  host: `example.com`,
  port: 25565,
  version: `1.8.9`,
};

const bot = mineflayer.createBot(options);
const gui = mineflayer_gui.plugin(bot); // initialize the plugin

bot.once(`login`, async () => {

  // create the first item to click (hotbar)
  let compass = {
    display: 'Game menu',
    options: {
      hotbar: true,
      rightclick: true,
    },
  };
  let success = await gui.clickItem(compass, `Capture The Flag`, `4v4`); // navigate through various GUI menus until '4v4' is found
  if (success) { // item was found, and has been clicked
    console.log(`Successfully joined CTF!`);
    bot.chat(`/team join red`);
    return;
  }
  throw new Error(`Bot was unable to join CTF.`);
});
```
