module.exports.inject = function inject(bot, defaults) {
    return class Query {
        #delay       = defaults.delay
        #timeout     = defaults.timeout
        #window      = defaults.window
        #mouseButton = defaults.mouseButton
        #strictMatch = defaults.strictMatch
        #colourMatch = defaults.colourMatch
        #shiftHeld   = defaults.shiftHeld

        Set(callback) {
            return value => {
                callback(value)
                return this
            }
        }

        delay = this.Set(delay => {
            this.#delay = delay
        })

        timeout = this.Set(timeout => {
            this.#timeout = timeout
        })

        window = this.Set(window => {
            this.#window = window
        })

        mouseButton = this.Set(mouseButton => {
            this.#mouseButton = mouseButton
        })

        strictMatch = this.Set(strictMatch => {
            this.#strictMatch = strictMatch
        })

        colourMatch = this.Set(colourMatch => {
            this.#colourMatch = colourMatch
        })

        shiftHeld = this.Set(shiftHeld => {
            this.#shiftHeld = shiftHeld
        })
    }
}
