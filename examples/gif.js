const ChatMessage = require("prismarine-chat")(bot.version)

// create an object for matching "display" and "lore"
function createItem(display, lore) {
    this.display = new ChatMessage(display)
    this.lore = [
        new ChatMessage(lore)
    ]
}

async function example(window) {
    let options = { window }
    // clicks the item matching the object made with createItem
    await bot.gui.clickItem(options, new createItem("Buy", "1"))
    await bot.gui.clickItem(options, new createItem("Buy", "8"))
    await bot.gui.clickItem(options, new createItem("Buy", "64"))
    await bot.gui.clickItem(options, new createItem("Sell", "1"))
    await bot.gui.clickItem(options, new createItem("Sell", "8"))
    await bot.gui.clickItem(options, new createItem("Sell", "64"))
}

// get "window" from a listener, or bot.gui.getWindow
example(window)