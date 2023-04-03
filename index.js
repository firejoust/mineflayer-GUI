const Query = require("./src/query")

module.exports.plugin = function inject(bot) {
    bot.gui = new Plugin(bot)
}

function Plugin(bot) {
    this.Defaults = {
        timeout: 5000,
        window: bot.inventory,
        matchBy: "type",
        mouseButton: "left",
        shiftHeld: false,
        strictMatch: false,
        colourMatch: false,
        packet: false
    }
    this.Query = Query.inject(bot, this.Defaults)
}