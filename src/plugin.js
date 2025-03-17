const { Query } = require("./query")

class GuiPlugin {
    constructor(bot) {
        this.bot = bot
    }

    Query() {
        return new Query(this.bot)
    }
}

module.exports = {
    GuiPlugin
}