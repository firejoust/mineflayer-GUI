import * as mineflayer from 'mineflayer';
import { Item as PrismarineItem } from 'prismarine-item'
import { Window as PrismarineWindow } from 'prismarine-windows'
import assert from 'assert';

// options for changing click variations
export interface ClickOptions {
    hotbar?: boolean, // if item should be selected in hotbar rather than inventory
    rightclick?: boolean, // which mouse button to click with
    clickamount?: number, // how many times to click the gui item
    shift?: boolean, // if holding shift while clicking
    timeout?: number, // the timeout to wait for a window to open
}

// parameters to narrow down what to click whilst navigating a GUI
export interface Item {
    display?: string,
    lore?: string,
    type?: string,
    data?: number,
    count?: number,
    options?: ClickOptions,
};

export class plugin {
    private bot: mineflayer.Bot

    constructor(bot: mineflayer.Bot) {
        this.bot = bot;
    }

    // a hacky way of determining if an object is a window. Does NOT type guard
    private isWindow(value: Object): boolean {
        if ((value as PrismarineWindow).slots) {
            return true;
        }
        return false;
    }

    private retreiveSlot(window: PrismarineWindow, item: Item): (number | null) {
        for (let slot of window.slots) {
            if (!slot) continue;
            let display: string = JSON.parse(slot.nbt?.value?.display?.value?.Name?.value)?.text || slot.displayName;
            let lore: string = JSON.parse(slot.nbt?.value?.display?.value?.Name?.value)?.lore || ``;

            console.log(display);

            let display_match = !(item.display == null) && display.includes(item.display);
            let lore_match = !(item.lore == null) && (lore) && lore.includes(item.lore);
            console.log(display_match);
            let type_match = !(item.type == null) && item.type === slot.name;
            let data_match = !(item.data == null) && item.data === slot.metadata;
            let count_match = !(item.count == null) && item.count === slot.count;

            // if two or more options specified, match if they are both accurate otherwise ignore.
            let match = (item.display == null || display_match) && (item.lore == null || lore_match) && (item.type == null || type_match) && (item.data == null || data_match) && (item.count == null || count_match);
            let hotbar = item.options?.hotbar && slot.slot <= 45 && slot.slot >= 36 // make sure accessible by hotbar
            if (match && !item.options?.hotbar || hotbar) return slot.slot;
        }
        return null;
    }

    private clickSlot(window: PrismarineWindow, slot: number, options?: ClickOptions) {
        for (let i = 0, clicks = (options?.clickamount || 1); i < clicks; i++) {
            this.bot._client.write('window_click', {
                windowId: window.id,
                slot: slot,
                mouseButton: options?.rightclick ? 1 : 0,
                action: 1,
                mode: options?.shift ? 1 : 0,
                item: { blockId: -1 },
            });
        }
    }

    private clickHotbarSlot(slot: number, options?: ClickOptions) {
        if (slot >= 36 && slot <= 45) {
            this.bot.setQuickBarSlot(slot === 45 ? this.bot.quickBarSlot : slot - 36); // hotbar slot starts at 36, offhand at 45
            for (let i = 0, clicks = options?.clickamount || 1; i < clicks; i++) {
                if (options?.rightclick) {
                    this.bot._client.write('use_item', {
                        hand: slot === 45 ? 1 : 0,
                    });
                }

                else {
                    let click_pos = this.bot.entity.position;
                    let click_block_face = 1;
                    this.bot.swingArm();

                    this.bot._client.write('block_dig', {
                        status: 0,
                        location: click_pos,
                        face: click_block_face,
                    });
                    this.bot._client.write('block_dig', {
                        status: 1,
                        location: click_pos,
                        face: click_block_face,
                    });
                }
            }
            return;
        }
        throw new Error(`Unable to get hotbar slot of non-hotbar item.`);
    }

    private async windowEvent(options?: ClickOptions): Promise<PrismarineWindow | null> {
        return new Promise<PrismarineWindow | null>((resolve) => {
            let complete = (window: PrismarineWindow, timeout: number) => {
                clearTimeout(timeout);
                resolve(window);
            }

            let terminate = () => {
                this.bot.removeListener("windowOpen", method);
                resolve(null);
            }

            let method = (window: PrismarineWindow) => complete(window, 5);
            let timeout = setTimeout(terminate, options?.timeout || 5000);
            this.bot.once("windowOpen", method);
        });
    }

    // retreives a window object by navigating through a specified GUI path
    // If path begins with a string/Item, will begin by searching inventory.
    // If path contains a window, will begin search from there
    async retreiveWindow(...path: ((string | Item | PrismarineWindow)[])): Promise<PrismarineWindow | null> {
        let current_window: (PrismarineWindow | null) = this.bot.inventory;

        for (let i = 0, pathlength = path.length; i < pathlength; i++) {
            let iterable = path[i];
            assert.ok(!this.isWindow(iterable) || this.isWindow(iterable) && i < 1, `Window can only be referenced at beginning of path.`); // check if slots exists on object to confirm that its a window

            if (this.isWindow(iterable)) {
                current_window = iterable as PrismarineWindow; // as isWindow doesn't type guard, casting is required
                continue;
            }

            else if (typeof iterable === 'object' || typeof iterable === 'string') {
                let item: Item = typeof iterable === 'string' ? { display: iterable } : iterable as Item;
                let slot = this.retreiveSlot(current_window, item);

                if (slot) {
                    item.options?.hotbar ? this.clickHotbarSlot(slot) : this.clickSlot(current_window, slot, item.options);
                    current_window = await this.windowEvent(item.options);

                    if (current_window) continue;
                }
            }
            return null;
        }
        return current_window;
    }

    async retreiveItem(...path: ((string | Item | PrismarineWindow)[])): Promise<PrismarineItem | null> {
        assert.ok(path.length > 1 || !this.isWindow(path[0]), `Path must include at least one item.`);
        assert.ok(!this.isWindow(path[path.length - 1]), `Window cannot be referenced at the end of path.`);
        
        let path_reference = Array.from(path);
        let element = path_reference.pop();
        let window = await this.retreiveWindow(...path_reference);

        // don't execute if final path element is a window or null
        if (window && element && !(this.isWindow(element))) {
            let item: Item = typeof element === 'string' ? { display: element } : element as Item;
            let slot = this.retreiveSlot(window, item);

            if (slot) {
                return window.slots[slot];
            }
        }
        return null;
    }

    async clickItem(...path: ((string | Item | PrismarineWindow)[])): Promise<boolean | null> {
        assert.ok(path.length > 1 || !this.isWindow(path[0]), `Path must include at least one item.`);
        assert.ok(!this.isWindow(path[path.length - 1]), `Window cannot be referenced at the end of path.`);
        let path_reference = Array.from(path);
        let element = path_reference.pop();
        let window = await this.retreiveWindow(...path_reference);

        if (window && element && !this.isWindow(element)) {
            let item: Item = typeof element === 'string' ? { display: element } : element as Item;
            let slot = this.retreiveSlot(window, item);

            if (slot) {
                item.options?.hotbar ? this.clickHotbarSlot(slot) : this.clickSlot(window, slot, item.options);
                return true;
            }
        }
        return null;
    }
}