const ChatMessage = require("prismarine-chat")(bot.version)

// create an object for configuring navigation
function createOptions(window) {
    this.window = window
    this.include = true // not matching text word for word
}

// create an object for matching "display" and "lore"
function createItem(name, lore) {
    this.name = new ChatMessage(name)
    this.lore = [
        new ChatMessage(lore)
    ]
}

async function example(window) {
    let options = new createOptions(window)
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
