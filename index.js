const assert = require(`assert`);

/**
 * @typedef {object} options
 * @property {boolean?} include Whether or not to check if an item includes a value rather than equating to it (Default: true)
 * @property {boolean?} hotbar If an item should be selected in the hotbar rather than the inventory (Default: false)
 * @property {boolean?} rightclick Which mouse button to click with (Default: false)
 * @property {number?} clickamount How many times to click the item (Default: 1)
 * @property {boolean?} shift If shift should be held whilst clicking (Default: false)
 * @property {number?} delay How long in milliseconds to wait before clicking an item (Default: 0)
 * @property {number?} timeout How long in milliseconds to wait for a window to open (Default: 5000)
 */

/**
 * @typedef {object} item
 * @property {string?} display The displayed name of an item
 * @property {string?} lore The lore of an item
 * @property {string?} type The type of an item
 * @property {number?} data The metadata of an item
 * @property {number?} count How much of an item is present
 * @property {options?} options
 * 
 */

module.exports = inject;

function inject(bot, options) {
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
     * @returns {string?} Display as a string
     */
    getDisplay(item) {
        try {
            let nbt = item.nbt.value.display.value.Name.value;
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
     * @returns {string?} Lore as a string
     */
    getLore(item) {
        try {
            let lores = item.nbt.value.display.value.Lore.value.value;
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
     * @param {item} item The item to match
     * @param {object?} window (Optional) The window to search in
     * @returns {number[]}
     */
    getSlots(item, window) {
        let slots = [];
        let query = window ?? (this.bot.currentWindow ?? this.bot.inventory);
        assert.ok(query, `Cannot retrieve slot of undefined window.`);

        for (let slot of query.slots) {
            if (!slot) continue;
            let include = item.options.include ?? true;
            let display = this.getDisplay(slot) ?? slot.displayName;
            let lore = this.getLore(slot) ?? ``;

            // Perform checks for each category in item
            let display_match = 'display' in item && include ? display.includes(item.display) : display === item.display;
            let lore_match = 'lore' in item && include ? lore.includes(item.lore) : lore === item.lore;
            let type_match = 'type' in item && include ? slot.name.includes(item.type) : slot.name === item.type;
            let data_match = 'data' in item && item.data === slot.metadata;
            let count_match = 'count' in item && item.count === slot.count;

            // Seperate normal and hotbar matching conditions
            let match = (!item.display || display_match) && (!item.lore || lore_match) && (!item.type || type_match) && (!item.data || data_match) && (!item.count || count_match);
            let hotbar = item.options.hotbar && slot.slot <= 45 && slot.slot >= 36;
        
            // Return first match of item
            if (match && (!item.options.hotbar || hotbar)) slots.push(slot.slot);
        }
        return slots;
    }

    /**
     * Clicks the specified item in the current window or inventory
     * @param {number} slot The window slot to click
     * @param {options} options Click options
     */
    clickSlot(slot, options) {
        let clicks = options.clickamount || 1;
        let hotbar = options.hotbar || false;

        if (hotbar) {
            assert.ok(slot >= 36 && slot <= 45, `Cannot click slot that isn't present in hotbar`);
            this.bot.setQuickBarSlot(slot === 45 ? this.bot.quickBarSlot : slot - 36); // hotbar slot starts at 36, offhand at 45

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
     * @async Waits for a window to open/close until the specified timeout
     * @param {string} event Either "windowOpen" or "windowClose".
     * @param {number} ms The timeout in milliseconds
     * @return {Promise<object?>} 
     */
    async windowEvent(event, ms) {
        assert.ok(event === 'windowOpen' || event === 'windowClose', `Invalid window event specified. Must be "windowOpen" or "windowClose".`);
        let handler, timeout;
        return new Promise((resolve) => {
            handler = (window) => resolve(window);
            timeout = setTimeout(() => resolve(null), ms);
            this.bot.once(event, handler);
        }).finally(() => {
            this.bot.removeListener(event, handler);
            clearTimeout(timeout);
        });
    }

    /**
     * @async Retrieves a window by navigating through a specified GUI path
     * @param {(string|item|object)[]} path The path to navigate through
     * @return {Promise<object?>} An instance of a PrismarineWindow or null if nothing was found / an error occured.
     */
    async getWindow(...path) {
        let path_instance = [...path];
        let starting_object = (typeof path[0] === 'object' && path[0].slots) ? path_instance.shift() : null;

        // Close currently open window if not explicitly specified in path
        if (!starting_object && this.bot.currentWindow) {
            this.bot.closeWindow(this.bot.currentWindow);
        }

        let window = starting_object ?? this.bot.inventory; // instance of prismarinewindow

        for (let object of path_instance) {
            assert.ok(!object.slots, `Window can only be referenced at the beginning of a path.`);
            assert.ok(typeof object === 'string' || typeof object === 'object', TypeError(`Excepted object or string in path, but got ${typeof object}.`));
            let item = typeof object === 'string' ? { display: object } : object;
            item.options = item.options || {};
            let slot = this.getSlots(item)[0]; // get the first result

            if (typeof slot === 'number') {
                await new Promise((resolve) => setTimeout(resolve, item.options.delay || 0));
                this.clickSlot(slot, item.options);
                let response = await this.windowEvent(`windowOpen`, item.options.timeout || 5000);

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
     * @param {(string|item|object)[]} path The path to navigate through
     * @return {Promise<object[]?>} An instance of a PrismarineItem (Array) or null if an error occured.
     */
    async getItems(...path) {
        let path_instance = [...path]
        let final_object = path_instance.pop();
        assert.ok(path.length > 0, `Path must specify at least 1 item.`);
        assert.ok(path.length > 1 || typeof path[0] !== 'object' || !path[0].slots, `Path cannot only be only a window. Must specify at least 1 item.`);
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
    /**
     * @async Clicks a single item specified in the GUI path.
     * @param {(string|item|object)[]} path The path to navigate through
     * @return {Promise<object?>} An instance of a PrismarineItem or null if nothing was found.
     */
    async clickItem(...path) {
        let path_instance = [...path]
        let final_object = path_instance.pop();
        assert.ok(path.length > 0, `Path must specify at least 1 item.`);
        assert.ok(path.length > 1 || typeof path[0] !== 'object' || !path[0].slots, `Path cannot only be only a window. Must specify at least 1 item.`);
        let window = await this.getWindow(...path_instance);

        if (window) {
            let item = typeof final_object === 'string' ? { display: final_object } : final_object;
            item.options = item.options || {};
            let slot = this.getSlots(item, window)[0];

            if (typeof slot === 'number') {
                let prismarineitem = window.slots[slot];
                this.clickSlot(slot, item.options);
                return prismarineitem;
            }
        }
        return null;
    }
}