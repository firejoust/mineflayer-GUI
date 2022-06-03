const noop = _ => _

async function once_timeout(emitter, ms, event) {
    let timeout, success, failure
    success = this.noop
    failure = this.noop

    return new Promise(resolve => {
        // clear the timeout when event triggers
        timeout = setTimeout(failure, ms)
        success = (...args) => {
            clearTimeout(timeout)
            resolve(args)
        }
        
        // clear the event when timeout triggers
        emitter.once(event, success)
        failure = () => {
            emitter.removeListener(success, event)
            resolve(null)
        }
    })
}


module.exports = {
    noop,
    once_timeout
}