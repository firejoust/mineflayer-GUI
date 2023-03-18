const Query = require("./src/query")

module.exports.plugin = function inject(bot) {
    bot.gui = new Plugin(bot)
}

function Plugin(bot) {
    this.Query = Query.inject(bot, this.Defaults)
    this.Defaults = {
        delay: 0,
        timeout: 5000,
        window: bot.inventory,
        mouseButton: "left",
        strictMatch: false,
        colourMatch: false,
        shiftHeld: false,
    }
}