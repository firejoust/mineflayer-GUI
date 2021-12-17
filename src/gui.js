const assert = require("assert");
const comparison = require("./util/comparison");
const async = require("./util/async");

module.exports = class {
    constructor(bot) {
        this.bot = bot;
    }

    #advanceWindow(window, slot, hotbar) {
        // click item directly from the hotbar
        if (hotbar) {
            if (slot > 45 || slot < 36) throw Error(`Slot #${slot} does not lie within hotbar range! (36-45)`);
            this.bot.setQuickBarSlot(slot === 45 ? this.bot.quickBarSlot : slot - 36);
            this.bot._client.write('use_item', {
                hand: slot === 45 ? 1 : 0, // offhand slot uses opposite arm
            });
        }
        // click item from a gui window
        else {
            this.bot._client.write("window_click", {
                windowId: window.id,
                slot: match,
                mouseButton: 0,
                mode: 0,
            });
        }
    }

    getItemSlots(options, query) {
        let window = options.window || this.bot.inventory;
        let comparisons = options.comparisons || [comparison.type];
        let slots = [];
        // compare specified+slot item (find a match)
        for (let item of window.slots) {
            if (!item) continue;
            let valid = true;
            let itemData = this.bot.gui.item.getSimpleItem(item);

            comparisons.forEach(comparison => {
                valid = valid && comparison(query, itemData, options.colour, options.include);
            });

            if (valid) slots.push(item.slot);
        }
        return slots;
    }
    
    async getWindow(options, ...path) {
        let window = options.window || this.bot.inventory;

        // iterate every path item to navigate to final window
        for (let object of path) {
            let query = typeof object === "string" ? { type: object } : object;
            let config = Object.create(options);
            config.window = window;

            // determine item matches in a specified window
            let match = this.getItemSlots(config, query)[0];
            if (match) {
                this.#advanceWindow(window, match, options.hotbar && path.indexOf(object) === 0);
                let timeout = options.timeout || 5000;
                let status = await async.onceTimeout(this.bot, "windowOpen", w => window = w, timeout);
                if (status) continue;
            }
            return null;
        }
        return window;
    }

    async getItems(options, ...path) {
        assert.ok(path.length > 0, "At least one item needs to be specified in the path");
        // use the starting items in path to navigate to correct window
        let window = await this.getWindow(options, ...path.slice(0, -1));
        let object = path[path.length - 1];
        // only match the last item in path
        let query = typeof object === "string" ? { type: object } : object;
        let config = Object.create(options);
        config.window = window;
        // collect all item matches and place into array
        let items = this.getItemSlots(config, query).map(slot => window.slots[slot]);
        return items;
    }

    async clickItem(options, ...path) {
        let items = await this.getItems(options, ...path);

        if (items.length > 0) {
            await this.bot.clickWindow(items[0].slot, Number(!!options.rightclick), Number(!!options.shift));
            return items[0];
        }

        return null;
    }
}

/*
**  Ideas:
**  1. multiple comparisons can be specified in "options" as an array
*/

