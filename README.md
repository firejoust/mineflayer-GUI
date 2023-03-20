<h1 align="center">mineflayer-GUI</h1>
<div align="center">
<img src="https://img.shields.io/npm/v/mineflayer-gui?style=flat-square">
<img src="https://img.shields.io/github/issues-raw/firejoust/mineflayer-gui?style=flat-square">
<img src="https://img.shields.io/github/issues-pr-raw/firejoust/mineflayer-gui?style=flat-square">
<p align="center"><i>Manage nested GUI windows in mineflayer using a high level API</i></p>
<img src="gui.gif">
<p>^ An example of a GUI window ^</p>
</div>

### API
#### Type Reference
```js
class PrismarineWindow; // link: https://is.gd/h73B5h
class PrismarineItem;   // link: https://is.gd/ivNm7p
```
#### Loading the plugin
```js
const gui = require("mineflayer-gui")

...

bot.loadPlugin(gui.plugin)
```
#### Default Setter Values
- If you prefer, these can be manually set after loading the plugin
```js
bot.gui.Defaults = {
  timeout: 5000,
  window: bot.inventory,
  matchBy: "type",
  mouseButton: "left",
  shiftHeld: false,
  strictMatch: false,
  colourMatch: false,
}
```
#### Constructing a "Query"
- Note: all Setters are optional, the current window will be stored internally
```js
const Query = new bot.gui.Query()
.timeout(number)
.window(PrismarineWindow) // the starting window (inventory by default)
.matchBy('slot' | 'type' | 'display' | 'lore')
.mouseButton('left' | 'right')
.shiftHeld(boolean) // shift-click window items
.strictMatch(boolean) // if false, only match a portion of the query
.colourMatch(boolean) // if true, match queries can include section sign style colour codes
```
#### Methods
Specifying multiple match queries have the same effect for all methods

(ie, they will bring you to the final window, with its intended functionality used by the last match query)

If `matchBy` is `'type'`, `'display'`, or `'lore'`, Strings are used as arguments

If `matchBy` is `'slot'`, Numbers are used as arguments instead of Strings.
```ts
/*
  
*/
const window: PrismarineWindow? = await Query.getWindow(...matching)

/*
  
*/
const items: PrismarineItem[]? = await Query.getItems(...matching)

/*
  
*/
const items: PrismarineItem[]? = await Query.clickItems(...matching)
```
