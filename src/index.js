const { GuiPlugin } = require("./plugin")

module.exports = (bot) => {
    bot.gui = new GuiPlugin(bot)
}