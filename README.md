<h1 align="center">mineflayer-GUI</h1>
<div align="center">
<img src="https://img.shields.io/npm/v/mineflayer-gui?style=flat-square">
<img src="https://img.shields.io/github/issues-raw/firejoust/mineflayer-gui?style=flat-square">
<img src="https://img.shields.io/github/issues-pr-raw/firejoust/mineflayer-gui?style=flat-square">
<p align="center"><i>A mineflayer plugin simplifying management of nested GUI windows</i></p>
<img src="gui.gif">
<p>(An example of what this plugin can do)</p>
</div>

## Features
- Retrieve windows within nested GUI windows
- Retrieve and click items within nested GUI windows
- Extract item display, lore, enchantments & durability

## Example
- the gif above: [gif.js](examples/gif.js)

## API
```js
/*
**  Type reference
*/

class PrismarineItem // https://github.com/PrismarineJS/prismarine-item/blob/f8f80e992423efc4bb975eeb946dab92d389cf7b/index.d.ts#L7-L27
class PrismarineWindow // https://github.com/PrismarineJS/prismarine-windows/blob/55c8a6a71cc66a54b9ead4f48370884b9a0e8665/index.d.ts#L7-L191
class ChatMessage // https://github.com/PrismarineJS/prismarine-chat/blob/278b053a1a97ab6c0788d97c75f915461430b221/index.d.ts#L5-L64
class SimpleItem // see examples/item.js
...path = String[] OR Object[] // string is identical to object { type: "string" }
```
### Loading the plugin
```js
const gui = require("mineflayer-gui")

// ...

bot.loadPlugin(gui.plugin)

```
### Item
- This plugin includes a wrapper for representing items in a simpler way (credit: [u9g](https://github.com/u9g/simple-item))
- A majority of these wrapper methods are instantiated as `bot.gui.item` once the plugin has been loaded
- Formatted tags such as display names and lores are represented as a [ChatMessage](https://github.com/PrismarineJS/prismarine-chat/blob/278b053a1a97ab6c0788d97c75f915461430b221/index.d.ts#L5-L64)
```js
/*
**  SimpleItem
*/

// Creates a simplified representation of a PrismarineItem (See examples/item.js)
bot.gui.item.simpleItem(prismarineItem)

/*
**  SimpleItem methods
*/

// Extracts the display name of a PrismarineItem, represented as a ChatMessage (See examples/item.js)
bot.gui.item.getName(prismarineItem) 

// Extracts the lore of a PrismarineItem as an array of ChatMessage(s) (See examples/item.js)
bot.gui.item.getLore(prismarineItem)

// Extracts an array of enchantments from a PrismarineItem, represented as an array of Objects (See examples/item.js)
bot.gui.item.getEnchants(prismarineItem)

// Extracts the used + total durability from a PrismarineItem, represented as an Object (See examples/item.js)
bot.gui.item.getDurability(prismarineItem)
```
### GUI
- the main class `bot.gui` includes methods for retrieving items/windows located in nested GUI windows
- "options" is an object for configuring navigation behaviour between nested GUI windows
- "path" is an array of multiple strings/objects matching items that need to be clicked (to advance GUI windows)
```js
/*
**  GUI methods
*/

// Retrieves the final window from the given path. Returns an instance of a PrismarineWindow or null if nothing was found / window timed out.
async bot.gui.getWindow(options, ...path)

// Retrieves the first matching item in the path. Returns a PrismarineItem or null if no matches were found.
async bot.gui.getItem(options, ...path)

// Retrieves all matching items in the path. Returns a PrismarineItem array or null if no matches were found.
async bot.gui.getItems(options, ...path) 

// Retrieves and clicks the first matching item in the path. Returns a PrismarineItem or null if no matches were found.
async bot.gui.clickItem(options, ...path)

/*
**  "options" object
*/

options = {
    window: PrismarineWindow, // (Default: player's inventory) The window to start navigation from.
    delay: number, // (Default: 0) How long to wait before opening the next window
    timeout: number, // (Default: 5000) Expected duration a window should open within (in ms)
    close: boolean // (Default: false) If the current active window should be closed beforehand
    hotbar: boolean, // (Default: false) If the first window is initiated directly from the hotbar (ie. using an item)
    color: boolean, // (Default: false) Consider formatting codes when matching items (ie: item colour)
    include: boolean, // (Default: false) If string matching criteria should be non-strict
    rightclick: boolean, // (clickItem ONLY) (Default: false) If the final path item should be right clicked
    shift: boolean, // (clickItem ONLY) (Default: false) If the final path item should be shift clicked
}

/*
**  "...path" item
*/

match = "item_type" // the matching item type, as a String

// OR:

match = {
    type: String, // (Optional) the matching item type, as a String
    display: ChatMessage, // (Optional) the item display name, as a ChatMessage
    lore: ChatMessage[] // (Optional) the item lore, as a ChatMessage array
}
```
