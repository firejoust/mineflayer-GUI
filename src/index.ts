import * as mineflayer from 'mineflayer'; 
import { BotEvents } from 'mineflayer';
import TypedEmitter from "typed-emitter";
import { Item as PrismarineItem } from 'prismarine-item'
import { Window }  from 'prismarine-windows'
import assert from 'assert';

export namespace mineflayer_gui {

    type iterable_type = 'window' | 'display' | 'item';

    // options for changing click variations
    export interface ClickOptions {
        clicktype?:('left' | 'right'), // which mouse button to click with
        clickamount?:number, // how many times to click the gui item
        shift?:boolean, // if holding shift while clicking
        timeout?:number, // the timeout to wait for a window to open
    }

    // parameters to narrow down what to click whilst navigating a GUI
    export interface Item {
        display?:string,
        type?:string,
        data?:number,
        count?:number,
        options?:ClickOptions,
    };

    export class plugin {
        private bot:mineflayer.Bot

        constructor(bot:mineflayer.Bot) {
            this.bot = bot;
        }

        private retreiveIterableType(iterable:(string | Item | Window)): iterable_type {
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

        private retreiveSlot(window:Window, item:Item): (number | null) {
            for (let slot of window.items()) {
                let display_match = item.display && slot.customName.includes(item.display);
                let type_match = item.type && item.type === slot.displayName;
                let data_match = item.data && item.data === slot.type;
                let count_match = item.count && item.count === slot.count;

                // if two or more options specified, match if they are both accurate otherwise ignore.
                let match = (!item.display || display_match) && (!item.type || type_match) && (!item.data || data_match) && (!item.count && count_match);
                if (match) return slot.slot;
            }
            return null;
        }

        private async windowEvent(timeout?:number): Promise<Window|null> {
            return new Promise<Window|null>((resolve) => {
                let listener = this.bot.once("windowOpen", resolve);
                let terminate = () => {
                    this.bot.removeListener("windowOpen", resolve);
                    resolve(null);
                }
                setTimeout(terminate, timeout || 5000);
            });
        }

        // retreives a window object by navigating through a specified GUI path
        // If path begins with a string/Item, will begin by searching hotbar.
        // If path contains a window, will begin search from there
        async retreiveWindow(...path:((string | Item | Window)[])): Promise<Window|null> {
            let current_window:(Window | null) = null
            for (let i = 0, pathlength = path.length; i < pathlength; i++) {
                let iterable = path[i];
                let type = this.retreiveIterableType(iterable);
                assert.ok(type !== 'window' || type === 'window' && i < 1, `Window can only be referenced at beginning of path.`);

                switch (type) {
                    case 'window':
                        {
                            assert.ok(iterable instanceof Window, `'window' type was given when not a window.`);
                            current_window = iterable;
                        }
                    case 'display':
                        {
                            assert.ok(typeof iterable === 'string', `'display' type was given when not a string.`);
                            let item:Item = { display: iterable }
                            let current_window = (i < 1) ? this.bot.inventory : await this.windowEvent(item.options?.timeout);

                            if (current_window) {
                                let slot = this.retreiveSlot(current_window, item);
                                current_window.updateSlot(slot, 0);
                            }
                            i = pathlength; // terminate (window timeout)
                        }
                    case 'item':
                        {
                            assert.ok(!(iterable instanceof Window) && !(typeof iterable === 'string'), `'item' type was given when not an item.`);
                            let item:Item = iterable;
                            let current_window = (i < 1) ? this.bot.inventory : await this.windowEvent(item.options?.timeout);

                            if (current_window) {
                                let slot = this.retreiveSlot(current_window, item);
                            }
                            i = pathlength;
                        }
                }
            }
            return current_window;
        }

        async retreiveItem(...path:((string | Item | Window)[])): Promise<PrismarineItem|null> {

        }

        async clickItem(...path:((string | Item | Window)[])): Promise<boolean|null> {

        }
    }
}