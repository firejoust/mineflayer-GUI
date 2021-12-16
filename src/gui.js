module.exports = class {
    constructor(bot) {
        this.bot = bot;
    }

    getWindow(options, ...path) {
        let window = options.window || this.bot.inventory;
        for (let object of path) {
            let item = typeof object === "string" ? { type: object } : object;
        }
    }
}

/*
**  Ideas:
**  1. Have an "criteria" functon for comparing valid items. Either pre-defined in this plugin, or specifiable by a user
**  2. options at beginning of getXYZ methods. (Specify starting window, hotbar, etc)
**  3. use simple-item as a new set of functions (bot.gui.item)
**  4. Path objects in getXYZ methods are a simpleItem or string (for item type)
*/

