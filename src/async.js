async function waitForAll(iterable) {
  for (const promiseFn of iterable) {
    try {
      if ((await promiseFn()) === false) {
        return false;
      }
    } catch (error) {
      console.error("Promise execution failed:", error);
      return false;
    }
  }
  return true;
}

function waitForEventWithTimeout(emitter, eventName, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      emitter.removeListener(eventName, eventHandler);
      reject(new Error(`Timeout waiting for event: ${eventName} after ${timeout}ms`));
    }, timeout);

    function eventHandler(...args) {
      clearTimeout(timeoutId);
      resolve(args.length === 1 ? args[0] : args);
    }

    emitter.once(eventName, eventHandler);
  });
}

module.exports = {
  waitForAll,
  waitForEventWithTimeout,
};
