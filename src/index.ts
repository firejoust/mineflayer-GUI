import * as mineflayer from 'mineflayer';
import { Item as PrismarineItem } from 'prismarine-item'
import { Window } from 'prismarine-windows'
import assert from 'assert';

export namespace mineflayer_gui {

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

        private retreiveSlot(window: Window, item: Item): (number | null) {
            for (let slot of window.items()) {
                let display_match = item.display && slot.customName.includes(item.display);
                let type_match = item.type && item.type === slot.displayName;
                let data_match = item.data && item.data === slot.type;
                let count_match = item.count && item.count === slot.count;

                // if two or more options specified, match if they are both accurate otherwise ignore.
                let match = (!item.display || display_match) && (!item.type || type_match) && (!item.data || data_match) && (!item.count && count_match);
                let hotbar = item.options?.hotbar && slot.slot <= 45 && slot.slot >= 36 // make sure accessible by hotbar
                if (match && !item.options?.hotbar || hotbar) return slot.slot;
            }
            return null;
        }

        private clickSlot(window: Window, slot: number, options?: ClickOptions) {
            for (let i = 0, clicks = options?.clickamount || 1; i < clicks; i++) {
                this.bot._client.write('window_click', {
                    windowId: window.id,
                    slot: slot,
                    mouseButton: options?.rightclick ? 1 : 0,
                    action: this.bot.createActionNumber(),
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
                        this.bot.activateItem();
                        this.bot.deactivateItem();
                    }

                    else {
                        this.bot.swingArm();
                    }
                }
                return;
            }
            throw new Error(`Unable to get hotbar slot of non-hotbar item.`);
        }

        private async windowEvent(options?: ClickOptions): Promise<Window | null> {
            return new Promise<Window | null>((resolve) => {
                let complete = (window: Window, timeout: number) => {
                    clearTimeout(timeout);
                    resolve(window);
                }

                let terminate = () => {
                    this.bot.removeListener("windowOpen", method);
                    resolve(null);
                }

                let method = (window: Window) => complete(window, timeout);
                let timeout = setTimeout(terminate, options?.timeout || 5000);
                this.bot.once("windowOpen", method);
            });
        }

        // retreives a window object by navigating through a specified GUI path
        // If path begins with a string/Item, will begin by searching hotbar.
        // If path contains a window, will begin search from there
        async retreiveWindow(...path: ((string | Item | Window)[])): Promise<Window | null> {
            let current_window: (Window | null) = this.bot.inventory;

            for (let i = 0, pathlength = path.length; i < pathlength; i++) {
                let iterable = path[i];
                assert.ok(!(iterable instanceof Window) || iterable instanceof Window && i < 1, `Window can only be referenced at beginning of path.`);

                if (iterable instanceof Window) {
                    current_window = iterable;
                    continue;
                }

                else if (typeof iterable === 'object' || typeof iterable === 'string') {
                    let item: Item = typeof iterable === 'string' ? { display: iterable } : iterable;
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

        async retreiveItem(...path: ((string | Item | Window)[])): Promise<PrismarineItem | null> {
            assert.ok(path.length > 1 || !(path[0] instanceof Window), `Path must include at least one item.`);
            assert.ok(!(path[path.length - 1] instanceof Window), `Window cannot be referenced at the end of path.`);
            let path_reference = Array.from(path);
            let element = path_reference.pop();
            let window = await this.retreiveWindow(...path_reference);

            // don't execute if final path element is a window or null
            if (window && element && !(element instanceof Window)) {
                let item: Item = typeof element === 'string' ? { display: element } : element;
                let slot = this.retreiveSlot(window, item);

                if (slot) {
                    return window.slots[slot];
                }
            }
            return null;
        }

        async clickItem(...path: ((string | Item | Window)[])): Promise<boolean | null> {
            assert.ok(path.length > 1 || !(path[0] instanceof Window), `Path must include at least one item.`);
            assert.ok(!(path[path.length - 1] instanceof Window), `Window cannot be referenced at the end of path.`);
            let path_reference = Array.from(path);
            let element = path_reference.pop();
            let window = await this.retreiveWindow(...path_reference);

            if (window && element && !(element instanceof Window)) {
                let item: Item = typeof element === 'string' ? { display: element } : element;
                let slot = this.retreiveSlot(window, item);
                
                if (slot) {
                    item.options?.hotbar ? this.clickHotbarSlot(slot) : this.clickSlot(window, slot, item.options);
                    return true;
                }
            }
            return null;
        }
    }
}