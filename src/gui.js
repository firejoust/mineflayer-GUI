const assert = require("assert");
const comparison = require("./util/comparison");

module.exports = class {
    constructor(bot) {
        this.bot = bot;
    }

    #onceTimeout = async (id, ms) => new Promise(resolve => {
        let timeout;

        let success = (...result) => {
            clearTimeout(timeout);
            resolve(result);
        }

        this.bot.once(id, success);

        let failure = () => {
            this.bot.removeListener(id, success);
            resolve([]);    
        }

        timeout = setTimeout(failure, ms);
    });

    async #advanceWindow(slot, options) {
        // click item directly from the hotbar
        if (!options.hotbar) {
            await this.bot.clickWindow(slot, Number(!!options.rightclick), Number(!!options.shift));
        } else {
            assert.ok(36 <= slot && slot <= 45, `Slot #${slot} does not lie within hotbar range! (36-45)`);
            this.bot.setQuickBarSlot(slot === 45 ? this.bot.quickBarSlot : (slot - 36));
            this.bot.activateItem(slot === 45);
            this.bot.deactivateItem();
        }
        let response = await this.#onceTimeout("windowOpen", options.timeout || 5000);
        return response[0] || null;
    }

    #getItemSlots(options, query) {
        let window = options.window || this.bot.inventory;
        let comparisons = options.comparisons || [comparison.type];
        let slots = [];
        // compare specified+slot item (find a match)
        for (let item of window.slots) {
            if (!item) continue;
            let valid = true;
            let itemData = this.bot.gui.item.getSimpleItem(item);

            comparisons.forEach(comparison => {
                valid = valid && comparison(query, itemData, options.color, options.include);
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
            // update every path iteration
            config.window = window;
            config.hotbar = config.hotbar && path.indexOf(object) === 0;

            // determine item matches in a specified window
            let match = this.#getItemSlots(config, query)[0];
            if (match) {
                window = await this.#advanceWindow(match, config);
                if (window) continue;
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
        let items = this.#getItemSlots(config, query).map(slot => window.slots[slot]);
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