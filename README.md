<h1 align="center">mineflayer-GUI</h1>
<div align="center">
<img src="https://img.shields.io/npm/v/mineflayer-gui?style=flat-square">
<img src="https://img.shields.io/github/issues-raw/firejoust/mineflayer-gui?style=flat-square">
<img src="https://img.shields.io/github/issues-pr-raw/firejoust/mineflayer-gui?style=flat-square">
<p align="center"><i>A mineflayer plugin enabling for easy management of inventory/chest/etc GUIs</i></p>
<img src="gui.gif">
<p>(An example of what this plugin can do)</p>
</div>

## Features
- Automated interaction with chest GUIs commonly used on servers
- Effectively retrieve items from nested GUI windows with a specified path
- Item display, lore, enchantment & durability extraction

## Example
- See [simple.js](examples/simple.js)

## API
```js
/*
**  Types
*/

class PrismarineItem // https://github.com/PrismarineJS/prismarine-item/blob/f8f80e992423efc4bb975eeb946dab92d389cf7b/index.d.ts#L7-L27
class PrismarineWindow // https://github.com/PrismarineJS/prismarine-windows/blob/55c8a6a71cc66a54b9ead4f48370884b9a0e8665/index.d.ts#L7-L191
class ChatMessage // https://github.com/PrismarineJS/prismarine-chat/blob/278b053a1a97ab6c0788d97c75f915461430b221/index.d.ts#L5-L64
class SimpleItem // see sample.jsonc
path = String OR SimpleItem // see sample.jsonc for SimpleItem. String is identical to { type: "string" }
```
### Item
- This plugin includes a wrapper for representing items in a simpler way (credit: [u9g](https://github.com/u9g/simple-item))
- A majority of these wrapper methods are instantiated as `bot.gui.item` once the plugin has been loaded
- Formatted tags such as display names and lores are represented as a [ChatMessage](https://github.com/PrismarineJS/prismarine-chat/blob/278b053a1a97ab6c0788d97c75f915461430b221/index.d.ts#L5-L64)
```js
/*
**  Item simplification
*/

// Creates a simplified representation of a prismarineItem which can be passed onto bot.gui methods as a "path" item. (See sample.jsonc for an example)
bot.gui.item.simpleItem(prismarineItem)

/*
**  Individual item methods
*/

// Extracts the display name of a PrismarineItem, represented as a ChatMessage (See types for raw text extraction)
bot.gui.item.getName(prismarineItem) 

// Extracts the lore of a PrismarineItem as an array of ChatMessage(s) (See types for raw text extraction)
bot.gui.item.getLore(prismarineItem)

// Extracts an array of enchantments from a PrismarineItem, represented as an array of Objects (See sample.jsonc - "Enchantments")
bot.gui.item.getEnchants(prismarineItem)

// Extracts the used + total durability from a PrismarineItem, represented as an Object (See sample.jsonc - "Durability")
bot.gui.item.getDurability(prismarineItem)
```
### GUI
- The main class `bot.gui` has a collection of methods for GUI navigation & scraping items from GUI windows
- Each of these methods begin with a "options" parameter determining how navigation between windows should be handled (See "options" below)
- The "path" parameter is best represented as a series of items defining an order of navigating through nested GUI windows
```js
/*
**  GUI methods
*/

// Retrieves the final window from the given path. Returns an instance of a PrismarineWindow or null if nothing was found / window timed out.
async bot.gui.getWindow(options, ...path)

// Retrieves an array of PrismarineItem(s) matching the final item in the path. Returns a PrismarineItem array or null if the window timed out.
async bot.gui.getItems(options, ...path) 

// Clicks the final item in the path. Returns a PrismarineItem of the item that was clicked, or null if nothing was found / window timed out.
async bot.gui.clickItem(options, ...path)

/*
**  Configuration Options
*/

options = {
    window: PrismarineWindow, // (Default: player's inventory) The window to start navigation from.
    comparisons: void[], // (Default: Item type only) An array of functions that will be used to match path items to window items (See below: "Predefined Comparisons") 
    timeout: number, // (Default: 5000) How long in milliseconds to wait for a new window to open after clicking its item.
    hotbar: boolean, // (Default: false) If the first window should be initiated without opening the inventory, ie. clicking a held item.
    color: boolean, // (Default: false) If colour formatting should be considered whilst comparing items.
    include: boolean, // (Default: false) If strings specified in the path should be matched inclusively (similar to String.includes)
    rightclick: boolean, // (Default: false) If ALL items in the path should be right clicked between nested windows
    shift: boolean, // (Default: false) If ALL items in the path should be shift clicked between nested windows
}

/*
**  Predefined Comparisons
**  Note: comparison functions take four parameters being the path item, the window item, colour (see above "options.color") & include (see above "options.include")
*/

const gui = require("mineflayer-gui");

// Specify in "comparisons" if item display should be accounted for whilst comparing items.
gui.comparison.display

// Specify in "comparisons" if item lore should be accounted for whilst comparing items.
gui.comparison.lore

// (Included by default) Specify in "comparisons" if item types should be accounted for whilst comparing items.
gui.comparison.type
```
