const assert = require(`assert`);
let Item, Window;

/**
 * @typedef {object} options
 * @property {boolean?} hotbar If an item should be selected in the hotbar rather than the inventory
 * @property {boolean?} rightclick Which mouse button to click with
 * @property {number?} clickamount How many times to click the item
 * @property {boolean?} shift If shift should be held whilst clicking
 * @property {number?} delay How long to wait before clicking an item
 * @property {number?} timeout How long to wait for a window to open
 */

/**
 * @typedef {object} item
 * @property {string?} display The displayed name of an item found by hovering over it with a cursor
 * @property {string?} lore The lore of an item
 * @property {string?} type The type of an item
 * @property {number?} data The varying metadata of an item
 * @property {number?} count How much of an item is present
 * @property {options?} options
 * 
 */

module.exports = init;

function init(mineflayer) {
    return inject;
}

function inject(bot, options) {
    Item = require('prismarine-item')(options.version).Item;
    Window = require('prismarine-windows')(options.version).Window;
    bot.gui = plugin(bot);
}

class plugin {
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Retrieves a given item's display name in notchian format
     * @param item Instance of a PrismarineItem
     * @returns {string?}
     */
    getDisplay(item) {
        try {
            let nbt = item.nbt.value.display.value.Name.value;
            let json_nbt = JSON.parse(nbt);
            return json_nbt.text || null;
        }

        catch (err) {
            assert.ok(err instanceof TypeError, err);
            return null;
        }
    }

    /**
     * Retrieves the lore of a given item as a string. Lores are seperated by a newline operator (\n).
     * @param item Instance of a PrismarineItem
     * @returns {string?}
     */
    getLore(item) {
        try {
            assert.ok(item.nbt.value.display.value.Lore.value.value instanceof Array); // item lore NBT hard-coded to this path
            let lores = item.nbt.value.display.value.Lore.value.value;
            let lore = ``;

            // concatenate every lore item to a single string
            for (let line of lores) {
                let content = JSON.parse(line).text || ``;
                lore += `\n${content}`;
            }
            return lore;
        }
        
        catch (err) {
            assert.ok(err instanceof TypeError, err); // no lore exists; otherwise throw normal error
            return null;
        };
    }

    /**
     * Retrieves all open window slots matching a specified item
     * @param {item} item
     * @returns {number[]}
     */
    getSlots(item) {
        let slots = [];
        window = this.bot.currentWindow;
        assert.ok(window, `Cannot retrieve slot of undefined window.`);

        for (let slot of window.slots) {
            if (!slot) continue;
            let display = this.getDisplay(slot) || slot.displayName;
            let lore = this.getLore(slot) || ``;

            // Perform checks for each category in item
            let display_match = item.display != null && display.includes(item.display);
            let lore_match = item.lore != null && lore.includes(item.lore);
            let type_match = item.type != null && item.type === slot.name;
            let data_match = item.data != null && item.data === slot.metadata;
            let count_match = item.count != null && item.count === slot.count;

            // Seperate normal and hotbar matching conditions
            let match = (item.display == null || display_match) && (item.lore == null || lore_match) && (item.type == null || type_match) && (item.data == null || data_match) && (item.count == null || count_match);
            let hotbar = item.options.hotbar && slot.slot <= 45 && slot.slot >= 36;
        
            // Return first match of item
            if (match && (!item.options.hotbar || hotbar)) slots.push(slot.slot);
        }
        return slots;
    }

    /**
     * Clicks the specified item in the current window or inventory
     * @param {number} slot
     * @param {options} options
     */
    clickSlot(slot, options) {
        let clicks = options.clickamount || 1;
        let hotbar = options.hotbar || false;

        if (hotbar) {
            assert.ok(slot >= 36 && slot <= 45, `Cannot click slot that isn't present in hotbar`);

            // Right click mode in hotbar is using an item
            if (options.rightclick) {
                for (let counter = 0; counter < clicks; counter++) {
                    this.bot._client.write('use_item', {
                        hand: slot === 45 ? 1 : 0, // use offhand for slot 45
                    });
                }
                return;
            }

            // resume normal operation for left click
            let click_position = this.bot.entity.position;
            let click_block_face = 1;

                for (let counter = 0; counter < clicks; counter++) {
                    this.bot.swingArm();
                    this.bot._client.write('block_dig', {
                        status: 0,
                        location: click_position,
                        face: click_block_face,
                    });
                    this.bot._client.write('block_dig', {
                        status: 1,
                        location: click_position,
                        face: click_block_face,
                    });
            }
            return;
        }

        // click slot in window by default
        for (let counter = 0; counter < clicks; counter++) {
            this.bot.clickWindow(slot, options.rightclick ? 1 : 0, options.shift ? 1 : 0);
        }
    }
    /**
     * Waits for a window to open until the specified timeout
     * @param {number} ms The timeout in milliseconds
     * @return {Promise<void>}  
     */
    async windowEvent(ms) {
        let handler, timeout;
        return new Promise(function(resolve, reject) {
            handler = resolve;
            timeout = setTimeout(reject, ms);
            this.bot.once(`windowOpen`, handler);
        }).finally(function() {
            this.bot.removeListener(`windowOpen`, handler);
            clearTimeout(timeout);
        });
    }

    /**
     * Retrieves a window by navigating through a specified GUI path
     * @param {(string|item|object)[]} path
     * @return {object?}  
     */
    async getWindow(...path) {
        let path_instance = Array.from(path);
        let starting_object = path_instance.shift();
        let window = starting_object instanceof Window ? starting_object : this.bot.inventory;

        for (let object of path_instance) {
            assert.ok(!object instanceof Window, `Window can only be referenced at the beginning of a path.`);
            assert.ok(typeof object === 'string' || typeof object === 'object', TypeError(`Excepted object or string in path, but got ${typeof object}.`));
            let item = typeof object === 'string' ? { display: object, options: {} } : object;
            let slot = this.getSlots(item)[0];

            if (slot) {
                await new Promise((resolve) => setTimeout(resolve, item.options.delay || 0));
                this.clickSlot(slot, item.options);
                let response = await this.windowEvent(item.options.timeout || 5000);

                if (response) {
                    window = this.bot.currentWindow;
                    continue;
                }
                return null;
            }
        }
        return window;
    }

    async getItems();
    async clickItem();
}