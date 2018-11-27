const mainModule = require('../../run.js');
const utils = require('./utils.js');
const uuidGen = require('uuid/v4');

module.exports = {
    connect(socket) {
        utils.logInfo(`Client connected - user-agent: ${socket.handshake.headers['user-agent']} - Awaiting host/play and ID...`);
        socket.on('disconnect', () => {
            for (let i = 0; i < mainModule.players.length; i++) {
                if (mainModule.players[i].id === socket.gameUUID) {
                    mainModule.players.splice(i, 1);
                    utils.logInfo(`Deleted player at index ${i} with UUID of: ${socket.gameUUID}`);
                }
            }
            utils.logInfo('Client disconnect');
        });

        socket.on('join-ask', type => {
            let packet = {};
            if (type === 'host') {
                packet.connectionType = 'host';
                packet.id = 'host';
            } else {
                packet.connectionType = 'player';
                packet.id = uuidGen();
            }         
            socket.gameUUID = packet.id;
            mainModule.players.push(packet);
            utils.logInfo(`${packet.id === 'host' ? 'Host' : 'Player'} registered id: ${packet.id} with connectionType: ${packet.connectionType}\n\nPlayers now:\n`);
            console.dir(mainModule.players);
            socket.emit('join-confirm', packet);
        });
    },
};