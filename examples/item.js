
async function example(item) {
  let simple_item = bot.gui.item.getSimpleItem(item)
  console.log(
    // the type of an item
    "type:", simple_item.type, "\n",

    // how many of an item
    "count:", simple_item.count, "\n",

    // the display of an item (ChatMessage)
    "name:", simple_item.name.toString(), "\n",

    // the lore of an item (ChatMessage array)
    "lore:", simple_item.lore.map(
      lore_object => {
        return lore_object.toString()
      }
    ).join("\n"), "\n",

    // the enchantments of an item (object)
    "enchantments:", simple_item.enchantments.map(
      enchant_object => {
        return ```
          name: ${enchant_object.name}
          level: ${enchant_object.level}
        ```
      }
    ).join(), "\n",

    // the durability of an item (object)
    "durability", simple_item.durability.map(
      durability_object => {
        return ```
          current: ${durability_object.current}
          max: ${durability_object.max}
        ```
      }
    ).join(), "\n"
  )
}

// "item" is a PrismarineItem, which can be retrieved from createBot/gui methods
example(item)