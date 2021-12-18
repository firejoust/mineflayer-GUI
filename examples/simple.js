const mineflayer = require("mineflayer");
const gui = require("mineflayer-gui");
const bot = mineflayer.createBot({}); // etc.
bot.loadPlugin(gui.plugin);

bot.on("message", async json => {
    let message = json.toString();

/*
**  EXAMPLE 1: Send a chat message containing the display of the player's currently held item
*/

    if (message.includes("$holding")) {
        let item = bot.gui.item.getSimpleItem(bot.heldItem);
        bot.chat(item.name ? `This item's name is ${item.name.toString()}!` : "This item doesn't have a name!");
        // ALTERNATIVELY the simple item doesn't have to be retrieved.
        // "bot.gui.item.getName(bot.heldItem)" works in place of "item.name". They are identical.
    }

/*
**  EXAMPLE 2: Retrieving & reading the name of a GUI menu initiated by a "game menu" compass.
*/

    else if (message.includes("$games")) {
        let options = {
            hotbar: true, // We are clicking an item through the hotbar, so this need to be true.
            comparisons: [
                gui.comparison.type, // (THIS IS DEFAULT) To find the matching item, only the item type should be compared.
            ]
        };

        let compass = {
            display: "Game Menu", // Depending on if "color" is enabled in options, this can potentially use section signs to match formatting codes too.
            type: "compass",
        }

        let window = await bot.gui.getWindow(options, compass);
        bot.chat(window ? `The title of this window is ${window.title}!` : "No window was found! Where's my compass?");
    }

/*
**  EXAMPLE 3: Navigating through a command-initiated nested GUI window to find a list of friends on a certain server
*/

    else if (message.includes("$friends")) {
        bot.chat("/settings"); // The "/settings" command will bring up a GUI window.

        // listen for the window and set the variable once it has been found
        let window = null;
        await bot.once("windowOpen", response => window = response);

        let options = {
            window, // We are not starting from the inventory, so the window needs to be explicitly defined
        }

        // The player will click a compass, wait for the next window, click the diamond, etc. The final item will be matched, and a list of items will be retrieved.
        let friends = await bot.gui.getItems(options, "compass", "diamond", "player_head");
        let usernames = friends.map(item => bot.gui.item.getName(item).toString()); // Each "player_head" has a display name with a player's username.

        // Send the usernames of all the player's friends to the chat.
        bot.chat(`I have ${usernames.length} friends! ${usernames.join(", ")}`);
    }
});