const mainModule = require('../../run.js');
const runtime = require('./runtime.js');
const utils = require('./utils.js');
const uuidGen = require('uuid/v4');

module.exports = {
    connect(socket) {
        const isHostSocket = socket.handshake.headers.referer.endsWith('/host/');
        utils.logInfo(`${isHostSocket ? 'Host' : 'Client'} connected - user-agent: ${socket.handshake.headers['user-agent']} - Awaiting host/play and ID...`);
        socket.on('disconnect', () => {
            for (let i = 0; i < mainModule.players.length; i++) {
                if (mainModule.players[i].id === socket.gameUUID) {
                    mainModule.players.splice(i, 1);
                    utils.logInfo(`Deleted player at index ${i} with UUID of: ${socket.gameUUID}`);
                    mainModule.playerIO.emit('players-update', mainModule.players);
                    mainModule.hostIO.emit('players-update', mainModule.players);
                }
            }
            utils.logInfo('Client disconnect');
        });

        socket.on('auto-assign', () => {
            let foundHost = false;
            for (let i = 0; i < mainModule.players.length; i++) {
                if (mainModule.players[i].connectionType === 'host') {
                    foundHost = true;
                    socket.emit('auto-assign-complete', true);
                    break;
                }
            }
            if (!foundHost) socket.emit('auto-assign-complete', false);
        });

        socket.on('join-ask', requestedPlayerObj => {
            let packet = {};
            packet.nickname = requestedPlayerObj.nickname.length < 0 || requestedPlayerObj.nickname.length > 20 ? 'invalid-nickname' : requestedPlayerObj.nickname;
            if (requestedPlayerObj.connectionType === 'host') {
                packet.connectionType = 'host';
                packet.id = 'host';
            } else {
                packet.connectionType = 'player';
                packet.id = uuidGen();
            }         
            socket.gameUUID = packet.id;
            packet.socketID = socket.id;
            mainModule.players.push(packet);
            utils.logInfo(`${packet.id === 'host' ? 'Host' : 'Player'} registered game UUID: ${packet.id} socketID: ${packet.socketID} with connectionType: ${packet.connectionType}\n\nPlayers now:\n`);
            console.dir(mainModule.players);
            socket.emit('join-confirm', packet);
            mainModule.playerIO.emit('players-update', mainModule.players);
            mainModule.hostIO.emit('players-update', mainModule.players);
        });

        socket.on('game-start-ask', gameInfo => {
            const isHostSocket = socket.handshake.headers.referer.endsWith('/host/') && socket.gameUUID === 'host';
            utils.logInfo(`Client asked to start the game! Is it the host? ${isHostSocket} UUID: ${socket.gameUUID} gameInfo:`);
            console.dir(gameInfo);
            //TODO: use Ajv to validate the json sent by the client
            if (isHostSocket) {
                mainModule.currentGame = gameInfo.game;
                mainModule.hostIO.emit('game-start-countdown', 3000);
                mainModule.playerIO.emit('game-start-countdown', 3000);
                setTimeout(() => {
                    mainModule.hostIO.emit('game-start', gameInfo);
                    mainModule.playerIO.emit('game-start', {name:gameInfo.game.gameSetName,author:gameInfo.game.author});
                    runtime.gameStart(socket);
                }, 4500); // Wait a little longer just to make sure that all the clients have finished their countdown.
            } else {
                utils.logWarn(`A client that is not the host attempted to start the game! Client: ${socket.gameUUID} ID: ${socket.id}`);
            }
        });

        socket.on('answer-submit', answer => runtime.manageAnswerSubmit(socket, answer));
    },
};