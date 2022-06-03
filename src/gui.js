const assert = require("assert")
const comparison = require("./util/comparison")
const async = require("./util/async")

module.exports = class {
    constructor(bot) {
        this.bot = bot
    }

    advanceWindow(slot, hotbar) {
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

    getItemSlots(query_item, window, color, include) {
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
                    color,
                    include
                )
            }

            if (match) slots.push(item.slot)
        }

        return slots
    }
    
    async getWindow(options, ...path) {
        // close windows that are already open
        if (options.close && this.bot.currentWindow)
        this.bot.closeWindow(this.bot.currentWindow)

        let config = {
            window: options.window || this.bot.inventory,
            delay: options.delay || 0,
            timeout: options.timeout || 5000,
            close: options.close || false,
            hotbar: options.hotbar || false,
            color: options.color || false,
            include: options.include || false,
            rightclick: options.rightclick || false,
            shift: options.shift || false
        }

        // iterate every path item to navigate to final window
        for (let object of path) {
            let query = typeof object === "string" ? { type: object } : object
            let match = this.getItemSlots(
                query,
                config.window,
                config.color,
                config.include
            )[0]

            // select the item to advance to a new window
            if (match != undefined) {
                this.advanceWindow(match, config.hotbar && path.indexOf(object) === 0)
                let response = await async.once_timeout(this.bot, options.timeout, "windowOpen")

                // wait before checking the next window
                if (response != null) {
                    config.window = response[0] // first argument is window
                    await new Promise(resolve => setTimeout(resolve, config.delay))
                    continue
                }
            }
            return null
        }
        return config.window
    }

    async getItems(options, ...path) {
        assert.ok(path.length > 0, "At least one item needs to be specified in the path")

        // use the starting items in path to navigate to correct window
        let window = await this.getWindow(options, ...path.slice(0, -1))
        let object = path[path.length - 1]
        let query = typeof object === "string" ? { type: object } : object
        if (window === null) return null

        // collect all item matches and place into array
        return this.getItemSlots(
            query,
            window,
            options.color || false,
            options.include || false
        ).map(slot => window.slots[slot])
    }

    async getItem(options, ...path) {
        let items = await this.getItems(options, ...path)
        return (items === null || items.length < 1)
        ? null
        : items[0]
    }

    async clickItem(options, ...path) {
        let item = await this.getItem(options, ...path)

        if (item) {
            await this.bot.clickWindow(item.slot, Number(!!options.rightclick), Number(!!options.shift))
            return item
        }

        return null
    }
}