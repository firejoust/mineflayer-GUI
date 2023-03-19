const Minecraft = require("minecraft-data")
const ChatMessage = require("prismarine-chat")
const Item = require("./item")

module.exports.inject = function inject(bot, defaults) {
    return class Query {
        #delay       = defaults.delay
        #timeout     = defaults.timeout
        #window      = defaults.window
        #matchBy     = defaults.matchBy
        #mouseButton = defaults.mouseButton
        #strictMatch = defaults.strictMatch
        #colourMatch = defaults.colourMatch
        #shiftHeld   = defaults.shiftHeld

        // load version dependants
        Minecraft = Minecraft(bot.majorVersion)
        ChatMessage = ChatMessage(bot.majorVersion)
        Item = Item.inject(ChatMessage)

        #Set(callback) {
            return value => {
                callback(value)
                return this
            }
        }

        delay = this.#Set(delay => {
            this.#delay = delay
        })

        timeout = this.#Set(timeout => {
            this.#timeout = timeout
        })

        window = this.#Set(window => {
            this.#window = window
        })

        matchBy = this.#Set(matchBy => {
            this.#matchBy = matchBy
        })

        mouseButton = this.#Set(mouseButton => {
            this.#mouseButton = mouseButton
        })

        strictMatch = this.#Set(strictMatch => {
            this.#strictMatch = strictMatch
        })

        colourMatch = this.#Set(colourMatch => {
            this.#colourMatch = colourMatch
        })

        shiftHeld = this.#Set(shiftHeld => {
            this.#shiftHeld = shiftHeld
        })

        /*
            matches the item in the current window at the index specified to the string specified
            an item match depends on what init properties were set
        */
        isItemMatch(index, match) {
            switch (this.#matchBy) {
                case 'slot':
                    const slot = this.Item.getSlot(this.#window.slots[index])
                    return slot === match // strictMatch doesn't apply

                case 'type':
                    const type = this.Item.getType(this.#window.slots[index])
                    return (this.#strictMatch ? type === match : type.includes(match))

                case 'display':
                    const display = this.Item.getDisplay(this.#window.slots[index], this.#colourMatch)
                    return (this.#strictMatch ? display === match : display.includes(match))

                case 'lore':
                    const lore = this.Item.getLore(this.#window.slots[index], this.#colourMatch)
                    return (this.#strictMatch ? lore === match : lore.includes(match))

                default:
                    throw new TypeError("matchBy type specified is not supported")
            }
        }

        async hotbarClick(slot) {
            if (slot < 45)
                this.bot.setQuickBarSlot(slot - 36) // 0-8
            
            // click slot directly from the hotbar
            switch (this.#mouseButton) {
                case 'right':
                    this.bot.activateItem(slot === 45)
                    this.bot.deactivateItem()
                    break

                case 'left':
                    if (slot === 45)
                        throw new Error("A match was found in the hotbar, but offhand slot cannot be left clicked")
                    else
                        this.bot.swingArm()
                    break

                default:
                    throw new TypeError("mouseButton type specified is not supported")
            }
        }

        async windowClick(slot) {
            switch (this.#mouseButton) {
                case 'right':
                    await this.bot.clickWindow(slot, 1, Number(this.#shiftHeld))
                    break

                case 'left':
                    await this.bot.clickWindow(slot, 0, Number(this.#shiftHeld))
                    break

                default:
                    throw new TypeError("mouseButton type specified is not supported")
            }
        }

        async isWindowOpen() {
            return new Promise(resolve => {
                const timeout = setTimeout(() => {
                    this.bot.off("windowOpen", callback)
                    resolve(false)
                }, this.#timeout)

                const callback = window => {
                    this.#window = window
                    clearTimeout(timeout)
                    resolve(true)
                }

                this.bot.once("windowOpen", callback)
            })
        }

        /*
            opens the next window by clicking the matching item
            finds the window element to click based on "match" & init properties
        */
        async nextWindow(match) {
            for (let i = 0; i < this.#window.slots.length; i++)
                if (this.isItemMatch(i, match)) {
                    // match is within the hotbar
                    if (this.#window.id === bot.inventory.id && 36 <= i && i <= 45)
                        await this.hotbarClick(slot)
                    else
                        await this.windowClick(slot)

                    return await this.isWindowOpen()
                }
            return false // no matches found
        }

        async clickItems(...matching) {
            const items = new Array()

            for (
                let i = 0,
                il = (matching.length - 1);
                i <= il;
                i++
            )
           
            if (i < il) // navigate to the next window
                if (!await this.nextWindow()) // couldn't spawn a new window
                    return null

            else // target window is open, click the item
                for (let j = 0; j < this.#window.slots.length; j++)
                    if (this.isItemMatch(j, matching[il])) // an item match was found
                    {
                        items.push(this.#window.slots[j])
                        await this.windowClick(j)
                    }
                
            return items
        }

        async getItems(...matching) {
            const items = new Array()

            for (
                let i = 0,
                il = (matching.length - 1);
                i <= il;
                i++
            )
           
            if (i < il) // navigate to the next window
                if (!await this.nextWindow()) // couldn't spawn a new window
                    return null

            else // target window is open, click the item
                for (let j = 0; j < this.#window.slots.length; j++)
                    if (this.isItemMatch(j, matching[il])) // an item match was found
                        items.push(this.#window.slots[j])
                
            return items
        }

        async getWindow(...matching) {
            for (
                let i = 0,
                il = (matching.length - 1);
                i <= il;
                i++
            )

            if (i < il)
                if (!await this.nextWindow())
                    return null
            else
                return this.#window

            // no matches found
            return null
        }
    }
}