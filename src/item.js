const Nbt = require('prismarine-nbt')

module.exports.inject = function inject(ChatMessage) {
    return class Item {
        static getSlot(item) {
            return item.slot
        }

        static getType(item) {
            return item.name
        }

        static getDisplay(item, colourMatch) {
            if (item.nbt === null)
                return item.displayName
            else {
                const value = Nbt.simplify(item.nbt)?.display?.Name || item.displayName
                const message = new ChatMessage (
                    value.match(/(".*":".*")|(".*")/g) // json can be parsed
                    ? JSON.parse(value)
                    : value
                )
                return colourMatch ? message.toMotd() : message.toString()
            }
        }

        static getLore(item, colourMatch) {
            if (item.nbt === null)
                return ""
            else {
                const values = Nbt.simplify(item.nbt)?.display?.Lore || new Array(0)
                return values.map(value => new ChatMessage (
                    value.match(/(".*":".*")|(".*")/g)
                    ? JSON.parse(value)
                    : value
                ))
                .map(message => colourMatch ? message.toMotd() : message.toString())
                .join("\n")
            }
        }
    }
}