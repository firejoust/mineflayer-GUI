import * as mineflayer from 'mineflayer'; 
import { Item as PrismarineItem } from 'prismarine-item'
import { Window }  from 'prismarine-windows'

export namespace mineflayer_gui {

    // options for changing click variations
    export interface ClickOptions {
        clicktype?:('left' | 'right'),
        clickamount?:number,
        shift?:boolean,
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

        // retreives a window object by navigating through a specified GUI path
        // If path begins with a string/Item, will begin by searching hotbar.
        // If path contains a window, will begin search from there
        async retreiveWindow(...path:((string | Item | Window)[])): Promise<Window|null> {

        }

        async retreiveItem(...path:((string | Item | Window)[])): Promise<PrismarineItem|null> {

        }

        async clickItem(...path:((string | Item | Window)[])): Promise<boolean|null> {

        }
    }
}