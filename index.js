const gui = require("./src/gui");
const item = require("./src/item");
const comparison = require("./src/util/comparison");

module.exports = {
    plugin: bot => {
        bot.gui = new gui(bot);
        bot.gui.item = new item(bot.version);
    },
    comparison
}