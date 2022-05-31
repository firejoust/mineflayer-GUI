// resolves a promise after a timeout has been reached or an event has occured
const onceTimeout = (emitter, event, listener, ms) => new Promise(resolve => {
    let timeout = setTimeout(failure, ms)
    emitter.once(event, success)

    function success(...response) {
        clearTimeout(timeout)
        listener(...response)
        resolve(response)
    }

    function failure() {
        emitter.removeListener(event, success); 
        resolve(null)
    }
})

const noop = () => true

module.exports = {
    onceTimeout,
    noop
}