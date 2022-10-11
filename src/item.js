const prismarineNBT = require('prismarine-nbt')
const pattern = /(".*":".*")|(".*")/g

module.exports = class {
    constructor(version) {
        this.mcData = require("minecraft-data")(version)
        this.chatMessage = require("prismarine-chat")(version)
    }

    getName(prismarineItem) {
        if (prismarineItem.nbt === null) return null
        let nbt = prismarineNBT.simplify(prismarineItem.nbt)
        let text = nbt?.display?.Name || prismarineItem.name
        return new this.chatMessage(text.search(pattern) >= 0 ? JSON.parse(text) : text)
    }

    getLore(prismarineItem) {
        if (prismarineItem.nbt === null) return null
        let nbt = prismarineNBT.simplify(prismarineItem.nbt)
        let lore = nbt?.dispay?.Lore
        if (!lore) return null
        
        return nbt.display.Lore.map(line => {
            return new this.chatMessage(line.search(pattern) >= 0 ? JSON.parse(line) : line)
        })
    }
    
    getEnchants(prismarineItem) {
        return prismarineItem.enchants
    }

    getDurability(prismarineItem) {
        let durability = {}
        durability.max =  this.mcData.itemsByName[prismarineItem.name].maxDurability || null
        durability.current = durability.max - prismarineItem.durabilityUsed || null
        return durability
    }

    getSimpleItem(prismarineItem) {
        return {
            type: prismarineItem.name,
            count: prismarineItem.count,
            name: this.getName(prismarineItem),
            lore: this.getLore(prismarineItem),
            enchantments: this.getEnchants(prismarineItem),
            durability: this.getDurability(prismarineItem)
        }
    }
}