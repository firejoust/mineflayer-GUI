const gui = require("./src/gui")
const item = require("./src/item")

module.exports = {
    plugin: bot => {
        bot.gui = new gui(bot)
        bot.gui.item = new item(bot.version)
    }
}