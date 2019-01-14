module.exports = {
    logError(err) {
        return console.log(`\x1b[4m\x1b[33m[${process.uptime()}] ERROR: ${err}\x1b[0m`);
    },

    logInfo(info) {
        return console.log(`\x1b[1m\x1b[36m[${process.uptime()}] INFO: ${info}\x1b[0m`);
    },

    logWarn(warn) {
        return console.log(`\x1b[1m\x1b[91m[${process.uptime()}] WARN: ${warn}\x1b[0m`);
    },

    logDebug(deb) {
        return console.log(`\x1b[1m\x1b[92m[${process.uptime()}] DEBUG: ${deb}\x1b[0m`);
    },

    sortPlayers(players, sType) {
    	// The argument 'players' must be a players array with player objects defined by:
    	// { 
    	//		nickname: 'nick',
    	//		connectionType: 'player OR host',
    	//		id: 'UUID/V4',
    	//		socketID: 'socket.io ID' ,
    	//		votes: int,
    	//		voted: bool,
    	//		currentRoundAnswer: 'str',
    	//		points: int
    	// }

    	// sType must be either 'votes' or 'points'
    	if (!['votes', 'points'].includes(sType)) return new Error('Invalid sort type. Must be: "votes" or "points"');

    	players.sort((a, b) => {
    		return a[sType] - b[sType];
    	});

    	players.reverse();

    	return players;
    },

    timeoutAsync(callback, time) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                callback();
                resolve(true);
            }, time);
        });
    }
};