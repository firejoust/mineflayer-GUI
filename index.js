const assert = require(`assert`);
const versions = Object.keys(require(`minecraft-data`).versionsByMinecraftVersion.pc).map((version) => {return version});
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
    bot.gui = new plugin(bot, options);
}

class plugin {
    constructor(bot, options) {
        this.bot = bot;
        this.options = options;
    }

    /**
     * Retrieves a given item's display name in notchian format
     * @param item Instance of a PrismarineItem
     * @returns {string?}
     */
    getDisplay(item) {
        try {
            let nbt = (versions.indexOf(this.options.version) >= versions.indexOf(`1.12.2`)) ? item.nbt.value.display.value.Name.value : item.nbt.value.display.value.Name.value;
            return nbt || null;
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
            let lores = (versions.indexOf(this.options.version) >= versions.indexOf(`1.12.2`)) ? item.nbt.value.display.value.Lore.value.value : item.nbt.value.display.value.Lore.value.value;
            let lore = ``;

            // concatenate every lore item to a single string
            for (let line of lores) {
                let content = line;
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
     * @param {object?} window
     * @returns {number[]}
     */
    getSlots(item, window) {
        let slots = [];
        let query = window ?? (this.bot.currentWindow ?? this.bot.inventory);
        assert.ok(query, `Cannot retrieve slot of undefined window.`);

        for (let slot of query.slots) {
            if (!slot) continue;
            let display = this.getDisplay(slot) ?? slot.displayName;
            let lore = this.getLore(slot) ?? ``;

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
     * @async Waits for a window to open until the specified timeout
     * @param {number} ms The timeout in milliseconds
     * @return {Promise<boolean>}  
     */
    async windowEvent(ms) {
        let handler, timeout;
        return new Promise((resolve) => {
            handler = () => resolve(true);
            timeout = setTimeout(() => resolve(false), ms);
            this.bot.once(`windowOpen`, handler);
        }).finally(() => {
            this.bot.removeListener(`windowOpen`, handler);
            clearTimeout(timeout);
        });
    }

    /**
     * @async Retrieves a window by navigating through a specified GUI path
     * @param {(string|item|object)[]} path
     * @return {Promise<object?>}  
     */
    async getWindow(...path) {
        let path_instance = [...path]
        let starting_object = path[0] instanceof Window ? path_instance.shift() : null;
        let window = starting_object ?? this.bot.inventory;

        for (let object of path_instance) {
            assert.ok(!(object instanceof Window), `Window can only be referenced at the beginning of a path.`);
            assert.ok(typeof object === 'string' || typeof object === 'object', TypeError(`Excepted object or string in path, but got ${typeof object}.`));
            let item = typeof object === 'string' ? { display: object } : object;
            item.options = item.options || {};
            let slot = this.getSlots(item)[0];

            if (slot) {
                await new Promise((resolve) => setTimeout(resolve, item.options.delay || 0));
                this.clickSlot(slot, item.options);
                let response = await this.windowEvent(item.options.timeout || 5000);

                if (response) {
                    window = this.bot.currentWindow;
                    continue;
                }
            }
            return null;
        }
        return window;
    }

    /**
     * @async Retrieves items matching a string or item specified in the GUI path.
     * @param {(string|item|object)[]} path
     * @return {Promise<object[]?>} An instance of a PrismarineItem (Array)
     */
    async getItems(...path) {
        assert.ok(path.length > 0, `Path must specify at least 1 item.`);
        assert.ok(path.length > 1 || (path.length <= 1 && !(path[0] instanceof Window)), `Path cannot only be only a window. Must specify at least 1 item.`);
        let path_instance = [...path]
        let final_object = path_instance.pop();
        let window = await this.getWindow(...path_instance);

        if (window) {
            let items = [];
            let item = typeof final_object === 'string' ? { display: final_object } : final_object;
            item.options = item.options || {};
            let slots = this.getSlots(item, window);

            for (let slot of slots) {
                items.push(window.slots[slot]);
            }
            return items;
        }
        return null;
    }

    //async clickItem();
}