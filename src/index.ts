import * as mineflayer from 'mineflayer';
import { Item as PrismarineItem } from 'prismarine-item'
import { Window } from 'prismarine-windows'
import assert from 'assert';

export namespace mineflayer_gui {

    type iterable_type = 'window' | 'display' | 'item';

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

        private retreiveIterableType(iterable: (string | Item | Window)): iterable_type {
            switch (typeof iterable) {
                case 'object': // may not work.
                    {
                        if (iterable instanceof Window) {
                            return 'window';
                        }
                        return 'item';
                    }

                case 'string': return 'display';
                default: throw new Error(`Invalid path value specified. Must be either a string (displayname), window, or item.`);
            }
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
                    //action: actionId,
                    mode: options?.shift ? 1 : 0,
                    item: { blockId: -1 },
                });
            }
        }

        private clickHotbarSlot(slot: number, options?: ClickOptions) {
            if (slot >= 36 && slot <= 45) {
                this.bot.setQuickBarSlot(slot === 45 ? this.bot.quickBarSlot : slot - 36); // hotbar slot starts at 36, offhand at 45
                if (options?.rightclick) {
                    this.bot.activateItem();
                    this.bot.deactivateItem();
                }

                else {
                    this.bot.swingArm();
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
            let current_window: (Window | null) = null
            for (let i = 0, pathlength = path.length; i < pathlength; i++) {
                let iterable = path[i];
                assert.ok(!(iterable instanceof Window) || iterable instanceof Window && i < 1, `Window can only be referenced at beginning of path.`);

                if (iterable instanceof Window) {
                    current_window = iterable;
                }

                else if (typeof iterable === 'object' || typeof iterable === 'string') {
                    let item: Item = typeof iterable === 'string' ? { display: iterable } : iterable;
                    let current_window = (i < 1) ? this.bot.inventory : await this.windowEvent(item.options);

                    if (current_window) {
                        let slot = this.retreiveSlot(current_window, item);

                        if (slot) {
                            item.options?.hotbar ? this.clickHotbarSlot(slot) : this.clickSlot(current_window, slot, item.options);
                            continue;
                        }

                        if (i+1 === pathlength) return current_window;
                        else throw new Error(`Item '${item.display}' was not found in GUI Window #${i}.`);
                    }
                    // no current window; now what?
                }
                return null;
            }
            return current_window;
        }

        async retreiveItem(...path: ((string | Item | Window)[])): Promise<PrismarineItem | null> {
            let window = await this.retreiveWindow(...path);
            return null;
        }

        async clickItem(...path: ((string | Item | Window)[])): Promise<boolean | null> {
            return null;
        }
    }
}