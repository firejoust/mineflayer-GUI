const { GuiPlugin } = require("./src/plugin")

module.exports = (bot) => {
    bot.gui = new GuiPlugin(bot)
}