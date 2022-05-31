const assert = require("assert")
const comparison = require("./util/comparison")
const async = require("./util/async")

module.exports = class {
    constructor(bot) {
        this.bot = bot
    }

    #advanceWindow(slot, hotbar) {
        // click item directly from the hotbar
        if (hotbar) {
            assert.ok(36 <= slot && slot <= 45, `Slot #${slot} does not lie within hotbar range! (36-45)`)
            this.bot.setQuickBarSlot(slot === 45 ? this.bot.quickBarSlot : (slot - 36))
            this.bot.activateItem(slot === 45)
            this.bot.deactivateItem()
        }

        // click item from a gui window
        else this.bot.clickWindow(slot, 0, 0)
    }

    getItemSlots(options, query_item) {
        let window = options.window || this.bot.inventory
        let slots = []
        // compare specified+slot item (find a match)
        for (let item of window.slots) {
            if (item === null || item.nbt === null) continue

            let match = true
            let match_item = this.bot.gui.item.getSimpleItem(item)
            let comparisons = []

            // determine which comparisons to use
            if (query_item.name && match_item.name) comparisons.push("display")
            if (query_item.type && match_item.type) comparisons.push("type")
            if (query_item.lore && match_item.lore) comparisons.push("lore")
            assert.ok(comparisons.length > 0, "Path item specified has no arguments! (nothing to match)")

            for (let key of comparisons) {
                match = match && comparison[key](
                    query_item,
                    match_item,
                    options.color,
                    options.include
                )
            }

            if (match) slots.push(item.slot)
        }
        return slots
    }
    
    async getWindow(options, ...path) {
        let window = options.window || this.bot.inventory

        // iterate every path item to navigate to final window
        for (let object of path) {
            let query = typeof object === "string" ? { type: object } : object
            // clone the existing configuration
            let config = {}
            for (let key in options) {
                config[key] = options[key]
            }
            config.window = window

            // determine item matches in a specified window
            let match = this.getItemSlots(config, query)[0]
            if (match) {
                this.#advanceWindow(match, options.hotbar && path.indexOf(object) === 0)
                let timeout = options.timeout || 5000
                let status = await async.onceTimeout(this.bot, "windowOpen", w => window = w, timeout)
                if (status) continue
            }
            return null
        }
        return window
    }

    async getItems(options, ...path) {
        assert.ok(path.length > 0, "At least one item needs to be specified in the path")
        // use the starting items in path to navigate to correct window
        let window = await this.getWindow(options, ...path.slice(0, -1))
        let object = path[path.length - 1]
        // only match the last item in path
        let query = typeof object === "string" ? { type: object } : object
        let config = {}
        for (let key in options) {
            config[key] = options[key]
        }
        config.window = window
        // collect all item matches and place into array
        let items = this.getItemSlots(config, query).map(slot => window.slots[slot])
        return items
    }

    async getItem(options, ...path) {
        let items = await this.getItems(options, ...path)
        return (items === null || items.length < 1) ? null : items[0]
    }

    async clickItem(options, ...path) {
        let items = await this.getItems(options, ...path)

        if (items.length > 0) {
            await this.bot.clickWindow(items[0].slot, Number(!!options.rightclick), Number(!!options.shift))
            return items[0]
        }

        return null
    }
}