module.exports = {
    logError(err) {
        return console.log(`\x1b[4m\x1b[33m[${process.uptime()}] ERROR: ${err}\x1b[0m`);
    },

    logInfo(info) {
        return console.log(`\x1b[1m\x1b[36m[${process.uptime()}] INFO: ${info}\x1b[0m`);
    }
};