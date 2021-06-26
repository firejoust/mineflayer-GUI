const assert = require(`assert`);
let Item, Window;

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
    /**
     * Create an instance of plugin.
     * @param {import('mineflayer').Bot} bot An instance of mineflayer.createBot
     */
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Retrieves a given item's display name in notchian format.
     * @param item Instance of a PrismarineItem
     * @returns {string | null}
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
     * @returns {string | null}
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
     * Retrieves an open window's slot according to a specified item.
     * @param item CUSTOM
     * @returns {number | null}
     */
    getSlot(item) {
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
            let hotbar = item.options?.hotbar && slot.slot <= 45 && slot.slot >= 36;
        
            // Return first match of item
            if (match && (!(item.options && item.options.hotbar) || hotbar)) return slot.slot;
        }
        return null;
    }

    clickSlot();
    clickHotbarSlot();
    async windowEvent();
    async getWindow();
    async getItem();
    async clickItem();
}