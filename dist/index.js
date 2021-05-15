"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
var prismarine_windows_1 = require("prismarine-windows");
var assert_1 = __importDefault(require("assert"));
//Directly import Window Class from prismarine-windows package /lib/Window.js
var item = require('prismarine-item')('1.16.5');
var WindowClass = require('../node_modules/prismarine-windows/lib/Window')(item);
;
var plugin = /** @class */ (function () {
    function plugin(bot) {
        this.bot = bot;
    }
    plugin.prototype.retreiveSlot = function (window, item) {
        var _a, _b;
        for (var _i = 0, _c = window.items(); _i < _c.length; _i++) {
            var slot = _c[_i];
            var display_match = item.display && slot.customName.includes(item.display);
            var type_match = item.type && item.type === slot.displayName;
            var data_match = item.data && item.data === slot.type;
            var count_match = item.count && item.count === slot.count;
            // if two or more options specified, match if they are both accurate otherwise ignore.
            var match = (!item.display || display_match) && (!item.type || type_match) && (!item.data || data_match) && (!item.count && count_match);
            var hotbar = ((_a = item.options) === null || _a === void 0 ? void 0 : _a.hotbar) && slot.slot <= 45 && slot.slot >= 36; // make sure accessible by hotbar
            if (match && !((_b = item.options) === null || _b === void 0 ? void 0 : _b.hotbar) || hotbar)
                return slot.slot;
        }
        return null;
    };
    plugin.prototype.clickSlot = function (window, slot, options) {
        for (var i = 0, clicks = (options === null || options === void 0 ? void 0 : options.clickamount) || 1; i < clicks; i++) {
            this.bot._client.write('window_click', {
                windowId: window.id,
                slot: slot,
                mouseButton: (options === null || options === void 0 ? void 0 : options.rightclick) ? 1 : 0,
                action: 1,
                mode: (options === null || options === void 0 ? void 0 : options.shift) ? 1 : 0,
                item: { blockId: -1 },
            });
        }
    };
    plugin.prototype.clickHotbarSlot = function (slot, options) {
        if (slot >= 36 && slot <= 45) {
            this.bot.setQuickBarSlot(slot === 45 ? this.bot.quickBarSlot : slot - 36); // hotbar slot starts at 36, offhand at 45
            for (var i = 0, clicks = (options === null || options === void 0 ? void 0 : options.clickamount) || 1; i < clicks; i++) {
                if (options === null || options === void 0 ? void 0 : options.rightclick) {
                    this.bot._client.write('use_item', {
                        hand: slot === 45 ? 1 : 0,
                    });
                }
                else {
                    var click_pos = this.bot.entity.position;
                    var click_block_face = 1;
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
        throw new Error("Unable to get hotbar slot of non-hotbar item.");
    };
    plugin.prototype.windowEvent = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var complete = function (window, timeout) {
                            clearTimeout(timeout);
                            resolve(window);
                        };
                        var terminate = function () {
                            _this.bot.removeListener("windowOpen", method);
                            resolve(null);
                        };
                        var method = function (window) { return complete(window, 5); };
                        var timeout = setTimeout(terminate, (options === null || options === void 0 ? void 0 : options.timeout) || 5000);
                        _this.bot.once("windowOpen", method);
                    })];
            });
        });
    };
    // retreives a window object by navigating through a specified GUI path
    // If path begins with a string/Item, will begin by searching inventory.
    // If path contains a window, will begin search from there
    plugin.prototype.retreiveWindow = function () {
        var _a;
        var path = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            path[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var current_window, i, pathlength, iterable, item_1, slot;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        current_window = this.bot.inventory;
                        i = 0, pathlength = path.length;
                        _b.label = 1;
                    case 1:
                        if (!(i < pathlength)) return [3 /*break*/, 6];
                        iterable = path[i];
                        assert_1.default.ok(!(iterable instanceof prismarine_windows_1.Window) || iterable instanceof prismarine_windows_1.Window && i < 1, "Window can only be referenced at beginning of path.");
                        if (!(iterable instanceof prismarine_windows_1.Window)) return [3 /*break*/, 2];
                        current_window = iterable;
                        return [3 /*break*/, 5];
                    case 2:
                        if (!(typeof iterable === 'object' || typeof iterable === 'string')) return [3 /*break*/, 4];
                        item_1 = typeof iterable === 'string' ? { display: iterable } : iterable;
                        slot = this.retreiveSlot(current_window, item_1);
                        if (!slot) return [3 /*break*/, 4];
                        ((_a = item_1.options) === null || _a === void 0 ? void 0 : _a.hotbar) ? this.clickHotbarSlot(slot) : this.clickSlot(current_window, slot, item_1.options);
                        return [4 /*yield*/, this.windowEvent(item_1.options)];
                    case 3:
                        current_window = _b.sent();
                        if (current_window)
                            return [3 /*break*/, 5];
                        _b.label = 4;
                    case 4: return [2 /*return*/, null];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, current_window];
                }
            });
        });
    };
    plugin.prototype.retreiveItem = function () {
        var path = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            path[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var path_reference, element, window, item_2, slot;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        /* Example usage of WindowClass to use instanceof */
                        this.bot.chat((path[path.length - 1] instanceof WindowClass).toString());
                        assert_1.default.ok(path.length > 1 || !(path[0] instanceof prismarine_windows_1.Window), "Path must include at least one item.");
                        assert_1.default.ok(!(path[path.length - 1] instanceof prismarine_windows_1.Window), "Window cannot be referenced at the end of path.");
                        path_reference = Array.from(path);
                        element = path_reference.pop();
                        return [4 /*yield*/, this.retreiveWindow.apply(this, path_reference)];
                    case 1:
                        window = _a.sent();
                        // don't execute if final path element is a window or null
                        if (window && element && !(element instanceof prismarine_windows_1.Window)) {
                            item_2 = typeof element === 'string' ? { display: element } : element;
                            slot = this.retreiveSlot(window, item_2);
                            if (slot) {
                                return [2 /*return*/, window.slots[slot]];
                            }
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    plugin.prototype.clickItem = function () {
        var _a;
        var path = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            path[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var path_reference, element, window, item_3, slot;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log(!(path[path.length - 1] instanceof prismarine_windows_1.Window));
                        assert_1.default.ok(path.length > 1 || !(path[0] instanceof prismarine_windows_1.Window), "Path must include at least one item.");
                        assert_1.default.ok(!(path[path.length - 1] instanceof prismarine_windows_1.Window), "Window cannot be referenced at the end of path.");
                        path_reference = Array.from(path);
                        element = path_reference.pop();
                        return [4 /*yield*/, this.retreiveWindow.apply(this, path_reference)];
                    case 1:
                        window = _b.sent();
                        if (window && element && !(element instanceof prismarine_windows_1.Window)) {
                            item_3 = typeof element === 'string' ? { display: element } : element;
                            slot = this.retreiveSlot(window, item_3);
                            if (slot) {
                                ((_a = item_3.options) === null || _a === void 0 ? void 0 : _a.hotbar) ? this.clickHotbarSlot(slot) : this.clickSlot(window, slot, item_3.options);
                                return [2 /*return*/, true];
                            }
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    return plugin;
}());
exports.plugin = plugin;
