<h1 align="center">mineflayer-GUI</h1>
<div align="center">
<img src="https://img.shields.io/npm/v/mineflayer-gui?style=flat-square">
<img src="https://img.shields.io/github/issues-raw/firejoust/mineflayer-gui?style=flat-square">
<img src="https://img.shields.io/github/issues-pr-raw/firejoust/mineflayer-gui?style=flat-square">
<p align="center"><i>Manage nested GUI windows in mineflayer using a high level API</i></p>
<img src="gui.gif">
<p>^ An example of what a GUI window would be^</p>
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

  (And will change per query made)
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
- Specifying multiple match queries will have the same effect for all methods

  (ie, match queries will navigate to the final window, with its intended functionality executed with the last match query)

- If `matchBy` is `'type'`, `'display'`, or `'lore'`, Strings are used as arguments

- If `matchBy` is `'slot'`, Numbers are used as arguments instead of Strings.
```ts
/*
  Returns the final window in a sequence of match queries
  Returns null if the window timed out
*/
const window: PrismarineWindow? = await Query.getWindow(...matching)

/*
  Returns a list of items matching the final match query
  Returns null if the window timed out
*/
const items: PrismarineItem[]? = await Query.getItems(...matching)

/*
  Returns a list of *clicked* items matching the final match query
  Returns null if the window timed out
*/
const items: PrismarineItem[]? = await Query.clickItems(...matching)
```
- Intended use example:
  1. Left clicking a `compass` with the display `Game Menu` in the hotbar, opening a GUI window
  2. Left clicking an `orange bed` with the display `Bed Wars`, opening another GUI window
  3. Left clicking a `gold block` with the display `4v4v4v4` (Joining the lobby) 
```js
const clickedItems = await new bot.gui.Query()
.matchBy('display')
.clickItems('Game Menu', 'Bed Wars', '4v4v4v4')

// "[ ...PrismarineItem, etc... ]" or "null" if one of the windows timed out
console.log(clickedItems)
```
#### Chaining Queries
- Using `bot.gui.advanceWindow`, it is possible to chain one large query from multiple complicated queries
```ts
/*
  Returns the current instance of 'Query' (Builder method)
  Returns null if the window timed out
*/
const Query = await bot.gui.advanceWindow(...matching)
```
- Intended use example:
  1. Right clicking a `compass` in the hotbar, opening a GUI window
  2. Left clicking `orange wool` with the display `Capture the Wool`, opening another GUI window
  3. Left clicking `red wool` with the display `Red Team` (Joining the lobby)
```js
const clickedItems = await new bot.gui.Query()
.mouseButton('right')
.advanceWindow('compass')
.then(Query => Query.matchBy('display')
  .advanceWindow('Capture the Wool'))
.then(Query => Query.clickItems('Red Team'))

// "[ ...PrismarineItem, etc... ]" or "null" if one of the windows timed out
console.log(clickedItems)
```
