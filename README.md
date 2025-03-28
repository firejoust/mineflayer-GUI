# Mineflayer GUI

A promise-based API for GUI interaction using [mineflayer](https://github.com/PrismarineJS/mineflayer). Simplifies automating interactions such as clicking through lobby selectors, navigating shop interfaces, etc. Features chainable async methods for clean, readable code when automating complex GUI interactions.

## Installation

```bash
npm install mineflayer
npm install mineflayer-gui
```

## Usage

```javascript
const mineflayer = require('mineflayer');
const gui = require('mineflayer-gui');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'MyBot',
});

bot.loadPlugin(gui)

// Example comparator - checks if item display name includes the argument
const comparator = (arg, item) => item.displayName.includes(arg);

bot.once('spawn', async () => {
  // Example query
  const query = bot.gui.Query()
    .Hotbar(comparator)
      .Open("Clock", "right") // Right click the Clock, and wait for the GUI window to open (default timeout: 5000ms)
    .end()
    .Window(comparator)
      .Click("Grass Block") // Left click the Grass Block
      .Click("Lime Bed") // Left click the Lime Bed
    .close() // same as 'end', but closes the window automatically

  const result = await query.run();

  // Result is a boolean 
  if (result) {
    console.log("Query executed successfully!");
  } else {
    console.log("Something went wrong.");
  }
});
```

## API Reference

### `bot.gui.Query()`

Creates a new query object. This is the starting point for all inventory operations. **Note:** Does **not** require `new` operator.

### `Query`

The main query object. Methods return selector objects (Hotbar, Window, Inventory) for further chaining.

*   `.Hotbar(comparator)`:
    * Selects the hotbar for operations.
*   `.Window(comparator)`:
    * Selects the currently open window (`bot.currentWindow`).
*   `.Inventory(comparator)`:
    * Selects the player's inventory (`bot.inventory`).
*   `.run()`:
    * Executes the queued operations. 
    * Returns a promise that resolves to `true` if all operations were successful, otherwise `false`.

`comparator` is a function `(item, p_Item) => boolean` that determines if an item matches. `item` is your search criteria (usually a string), and `p_Item` is the item being checked.

### `Hotbar`

*   `.Equip(item)`:
    * Equips the specified item from the hotbar.
*   `.Open(item, clickType = "right", timeout = 5000)`:
    * Clicks the specified item to open a window (e.g. right-clicking a compass).
    * `clickType` can be `"left"` or `"right"`.
    * `timeout` is in milliseconds (how long to wait for the window to open; `-1` to disable).
*   `.Drop(item, count = 64)`:
    * Drops the specified item from the hotbar.
    * `count` specifies the number of items to drop (up to 64).

### `Window`

*   `.Open(item, clickType = "left", timeout = 5000)`:
    * Clicks the specified item to open another window.
    * `clickType` can be `"left"`, `"right"`, or `"shift"`.
    * `timeout` is in milliseconds (how long to wait for the window to open; `-1` to disable).
*   `.Click(item, clickType = "left", count = 1)`:
    * Clicks the specified item within the window.
    * `clickType` can be `"left"`, `"right"`, or `"shift"`.
    * `count` is the number of times to click.
*   `.Move(item, slot)`:
    * Moves the specified item to the provided slot within the window.
*   `.Swap(item1, item2)`:
    * Swaps the positions of two items within the window.
*   `.Drop(item, count = 1)`:
    * Drops the specified item from the window.
    * `count` is the number of items to drop.

Special Method: `.close()`: Closes the current window and returns to the parent `Query` object (Equivalent to `.end()`).

### `Inventory`

Same methods as `Window`, but operates on the player's inventory. Does *not* have a `.close()` method that closes the inventory (since you can't programmatically close the player's inventory).

### `QuerySelector` (Base class; Common methods for Hotbar, Window, Inventory)

*   `.Sleep(milliseconds)`: Adds a delay to the operation queue.
*   `.end()`: Returns to the parent `Query` object.

### Comparators

Comparators determine if an item matches your criteria.

This function takes two arguments:

*   `item`: The item you're searching for (typically a string representing the `displayName`, but can also be a slot. Up to you).
*   `p_Item`: An item in the inventory/window/hotbar (a mineflayer `Item` object).

The comparator function should return `true` if the items match, and `false` otherwise.

**Examples:**

```javascript
// Example 1: Using a string for displayName (most common use case):
const comparator = (item, p_Item) => item === p_Item.displayName;

// Example 2: Using a number for slot.
const comparator = (item, p_Item) => item === p_Item.slot;

// ...

const query = new bot.gui.Query()
  .Inventory(comparator)
    .Open("Grass Block")
    // ... or if you're using the 2nd example:
    .Open(36) // first slot in hotbar (36 - 44)
  .end();
```
