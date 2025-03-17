const { waitForAll, waitForEventWithTimeout } = require("./async");

const ClickOptions = {
  left: {
    mode: 0,
    button: 0,
  },
  right: {
    mode: 0,
    button: 1,
  },
  shift: {
    mode: 1,
    button: 1,
  },
};

class Query {
  constructor(bot) {
    this.bot = bot;
    this.queue = [];
  }

  Hotbar(comparator) {
    return new Hotbar(this, comparator);
  }

  Window(comparator) {
    return new Window(this, comparator);
  }

  Inventory(comparator) {
    return new Inventory(this, comparator);
  }

  run() {
    return waitForAll(this.queue);
  }
}

class QuerySelector {
  constructor(parent, comparator) {
    this.parent = parent;
    this.comparator = comparator;
  }

  get bot() {
    return this.parent.bot;
  }

  get queue() {
    return this.parent.queue;
  }

  Sleep(milliseconds = 1000) {
    this.queue.push(async () => {
      return new Promise((resolve) => setTimeout(() => resolve(true), milliseconds));
    });

    return this;
  }

  end() {
    return this.parent;
  }

  _appendToQueue(asyncFunction) {
    this.queue.push(asyncFunction);
    this.Sleep(50); // Allow time for window to update
    return this;
  }
}

class Hotbar extends QuerySelector {
  // Unused in Hotbar
  get window() {
    return null;
  }

  Equip(item) {
    return this._appendToQueue(async () => {
      // Find the item in hotbar slots (0-8)
      for (let slot = 36; slot <= 44; slot++) {
        const p_Item = this.bot.inventory.slots[slot];

        // Item match found
        if (p_Item && this.comparator(item, p_Item)) {
          this.bot.setQuickBarSlot(slot - 36);
          return true;
        }
      }

      return false;
    });
  }

  Open(item, clickType = "right", timeout = 5000) {
    return this._appendToQueue(async () => {
      // Check if item is in offhand first
      const offhandItem = this.bot.inventory.slots[45]; // Slot 45 is offhand

      if (offhandItem && this.comparator(item, offhandItem)) {
        if (clickType === "right") {
          this.bot.activateItem(true); // Use item in offhand

          // Stop holding right click
          await this.bot.waitForTicks(1);
          this.bot.deactivateItem();

          if (timeout > 0) {
            await waitForEventWithTimeout(this.bot, "windowOpen", timeout);
          }

          return true;
        }
        // If clickType is "left" and item is in offhand, we skip and check hotbar
      }

      // Find the item in hotbar slots (0-8)
      for (let slot = 36; slot <= 44; slot++) {
        const p_Item = this.bot.inventory.slots[slot];

        // Item match found
        if (p_Item && this.comparator(item, p_Item)) {
          // Set the hotbar slot
          this.bot.setQuickBarSlot(slot - 36);

          // Perform the click based on clickType
          if (clickType === "right") {
            this.bot.activateItem();
            await this.bot.waitForTicks(1);
            this.bot.deactivateItem();
          } else if (clickType === "left") {
            await this.bot.swingArm();
          } else {
            throw new Error(`Invalid clickType "${clickType}", must be "left" or "right`);
          }

          if (timeout > 0) {
            await waitForEventWithTimeout(this.bot, "windowOpen", timeout);
          }

          return true;
        }
      }
      return false;
    });
  }

  Move(item, targetSlot) {
    return this._appendToQueue(async () => {
      // Find the item in hotbar slots (0-8)
      let sourceItem = null;
      let sourceSlot = -1;
      targetSlot = targetSlot + 36;

      for (let slot = 36; slot <= 44; slot++) {
        const p_Item = this.bot.inventory.slots[slot];

        // Item match found
        if (p_Item && this.comparator(item, p_Item)) {
          sourceItem = p_Item;
          sourceSlot = slot;
          break;
        }
      }

      if (sourceSlot === -1) {
        return false; // Source item not found in hotbar
      }

      // Validate target slot exists in inventory
      if (targetSlot < 0 || targetSlot >= this.bot.inventory.slots.length) {
        return false;
      }

      // Check destination slot state
      const destItem = this.bot.inventory.slots[targetSlot];

      // If destination has an item and it's the same type, we might be able to stack
      if (destItem && sourceItem.type === destItem.type && destItem.count < destItem.stackSize) {
        // Partial move possible - pick up source
        await this.bot.clickWindow(sourceSlot, 0, 0);
        // Place on destination (will stack as much as possible)
        await this.bot.clickWindow(targetSlot, 0, 0);

        // If we still have items in hand, put them back
        if (this.bot.inventory.selectedItem) {
          await this.bot.clickWindow(sourceSlot, 0, 0);
        }

        return true;
      }
      // If destination is empty
      else if (!destItem) {
        // Pick up source
        await this.bot.clickWindow(sourceSlot, 0, 0);
        // Place at destination
        await this.bot.clickWindow(targetSlot, 0, 0);
        return true;
      }

      return false; // Destination slot occupied with different/full item
    });
  }

  Drop(item, count = 64) {
    return this._appendToQueue(async () => {
      // Validate count is a number between 1 and 64
      const dropCount = Math.max(1, Math.min(64, count));

      // Find the item in hotbar slots (0-8)
      for (let slot = 36; slot <= 44; slot++) {
        const p_Item = this.bot.inventory.slots[slot];

        // Item match found
        if (p_Item && this.comparator(item, p_Item)) {
          // Set the hotbar slot
          this.bot.setQuickBarSlot(slot - 36);

          // Drop the items (limited by how many we actually have)
          const actualDropCount = Math.min(dropCount, p_Item.count);
          await this.bot.toss(p_Item.type, null, actualDropCount);

          return true;
        }
      }
      return false;
    });
  }
}

class Window extends QuerySelector {
  get window() {
    return this.bot.currentWindow;
  }

  Open(item, clickType = "left", timeout = 5000) {
    return this._appendToQueue(async () => {
      if (this.window === null) {
        return false;
      }

      // Validate clickType
      if (!ClickOptions[clickType]) {
        throw new Error(`Invalid clickType "${clickType}"`);
      }

      for (const p_Item of this.window.slots) {
        // Skip null items
        if (!p_Item) continue;

        // Item match found
        if (this.comparator(item, p_Item)) {
          // Click the matching item
          await this.bot.clickWindow(p_Item.slot, ClickOptions[clickType].button, ClickOptions[clickType].mode);

          try {
            // Wait for the next window with timeout
            if (timeout > 0) {
              await waitForEventWithTimeout(this.bot, "windowOpen", timeout);
            }

            return true;
          } catch (error) {
            // If timeout occurred, item might not be openable
            return false;
          }
        }
      }

      // No item matches were found
      return false;
    });
  }

  Click(item, clickType = "left", count = 1) {
    return this._appendToQueue(async () => {
      if (this.window === null) {
        return false;
      }

      // Validate clickType
      if (!ClickOptions[clickType]) {
        throw new Error(`Invalid clickType "${clickType}"`);
      }

      // Validate count
      const clickCount = Math.max(1, Math.min(64, count));

      for (const p_Item of this.window.slots) {
        // Skip null items
        if (!p_Item) continue;

        // Item match found
        if (this.comparator(item, p_Item)) {
          // For single click
          if (clickCount === 1) {
            await this.bot.clickWindow(p_Item.slot, ClickOptions[clickType].button, ClickOptions[clickType].mode);
            return true;
          }
          // For multiple clicks
          else {
            // Perform multiple clicks
            for (let i = 0; i < clickCount; i++) {
              await this.bot.clickWindow(p_Item.slot, ClickOptions[clickType].button, ClickOptions[clickType].mode);

              // Small delay between clicks to prevent server issues
              if (i < clickCount - 1) {
                await this.bot.waitForTicks(1);
              }
            }
            return true;
          }
        }
      }

      // No item matches were found
      return false;
    });
  }

  Move(item, slot) {
    return this._appendToQueue(async () => {
      if (this.window === null) {
        return false;
      }

      // Check if destination slot exists and is available
      if (slot < 0 || slot >= this.window.slots.length) {
        return false;
      }

      // Find the source item
      let sourceItem = null;
      let sourceSlot = -1;

      for (const p_Item of this.window.slots) {
        if (!p_Item) continue;

        if (this.comparator(item, p_Item)) {
          sourceItem = p_Item;
          sourceSlot = p_Item.slot;
          break;
        }
      }

      if (sourceSlot === -1) {
        return false; // Source item not found
      }

      // Pick up source
      await this.bot.clickWindow(sourceSlot, 0, 0);

      // Place at destination
      await this.bot.clickWindow(slot, 0, 0);

      return true;
    });
  }

  Swap(item1, item2) {
    return this._appendToQueue(async () => {
      if (this.window === null) {
        return false;
      }

      // Find slots for both items
      let slot1 = -1;
      let slot2 = -1;

      for (const p_Item of this.window.slots) {
        if (p_Item === null) continue;

        if (slot1 === -1 && this.comparator(item1, p_Item)) {
          slot1 = p_Item.slot;
        } else if (slot2 === -1 && this.comparator(item2, p_Item)) {
          slot2 = p_Item.slot;
        }

        if (slot1 !== -1 && slot2 !== -1) break;
      }

      if (slot1 === -1 || slot2 === -1) {
        return false; // One or both items not found
      }

      // Use the more reliable swap method:
      // 1. Pick up item1
      await this.bot.clickWindow(slot1, 0, 0);
      // 2. Place it on item2 (swapping them)
      await this.bot.clickWindow(slot2, 0, 0);
      // 3. If we need to put down the original item2 that's now in cursor
      if (this.bot.inventory.selectedItem) {
        await this.bot.clickWindow(slot1, 0, 0);
      }

      return true;
    });
  }

  Drop(item, count = 1) {
    return this._appendToQueue(async () => {
      if (this.window === null) {
        return false;
      }

      // Validate count is a number between 1 and 64
      const dropCount = Math.max(1, Math.min(64, count));

      for (const p_Item of this.window.slots) {
        // Skip null items
        if (!p_Item) continue;

        // Item match found
        if (this.comparator(item, p_Item)) {
          if (dropCount >= p_Item.count || dropCount === 64) {
            // Drop the entire stack
            await this.bot.clickWindow(p_Item.slot, 1, 4);
          } else {
            // Drop individual items
            for (let i = 0; i < dropCount; i++) {
              await this.bot.clickWindow(p_Item.slot, 0, 4);
            }
          }
          return true;
        }
      }

      // No item matches were found
      return false;
    });
  }

  close() {
    if (this.window !== null) {
      this.bot.closeWindow(this.window);
    }

    return this.parent;
  }
}

// Not that different from Window, except doesn't need to be opened/closed
class Inventory extends Window {
  get window() {
    return this.bot.inventory;
  }
}

module.exports = {
  Query,
};
