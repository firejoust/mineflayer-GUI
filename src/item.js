const Nbt = require('prismarine-nbt')

module.exports.inject = function inject(ChatMessage) {
    return class Item {
        static getType(item) {
            return item.type
        }

        static getDisplay(item, colourMatch) {
            if (item.nbt === null)
                return item.name
            else {
                const value = Nbt.simplify(item.nbt)?.display?.Name || item.name
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