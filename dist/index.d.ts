import * as mineflayer from 'mineflayer';
import { Item as PrismarineItem } from 'prismarine-item';
import { Window } from 'prismarine-windows';
export interface ClickOptions {
    hotbar?: boolean;
    rightclick?: boolean;
    clickamount?: number;
    shift?: boolean;
    timeout?: number;
}
export interface Item {
    display?: string;
    type?: string;
    data?: number;
    count?: number;
    options?: ClickOptions;
}
export declare class plugin {
    private bot;
    constructor(bot: mineflayer.Bot);
    private retreiveSlot;
    private clickSlot;
    private clickHotbarSlot;
    private windowEvent;
    retreiveWindow(...path: ((string | Item | Window)[])): Promise<Window | null>;
    retreiveItem(...path: ((string | Item | Window)[])): Promise<PrismarineItem | null>;
    clickItem(...path: ((string | Item | Window)[])): Promise<boolean | null>;
}
