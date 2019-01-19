const mainModule = require('../../run.js');
const runtime = require('./runtime.js');
const utils = require('./utils.js');
const uuidGen = require('uuid/v4');

module.exports = {
    connect(socket) {
        //if (mainModule.gameRunning) return socket.disconnect();
        const isHostSocket = socket.handshake.headers.referer.endsWith('/host/');
        utils.logInfo(`${isHostSocket ? 'Host' : 'Client'} connected - user-agent: ${socket.handshake.headers['user-agent']} - socketID: ${socket.id} - Awaiting host/play and ID...`);
        
        // We now push a player object on right away!
        const packet = {
            nickname: 'unconnected',
            connectionType: 'unconnected',
            id: uuidGen(),
            socketID: socket.id,
            points: 0
        }; 

        socket.gameUUID = packet.id;
        mainModule.players.push(packet);

        socket.emit('connect-confirm', packet);

        socket.on('disconnect', reason => {
            for (let i = 0; i < mainModule.players.length; i++) {
                if (mainModule.players[i].id === socket.gameUUID) {
                    mainModule.players.splice(i, 1);
                    utils.logInfo(`Deleted player at index ${i} with UUID of: ${socket.gameUUID}`);
                    mainModule.playerIO.emit('players-update', mainModule.players);
                    mainModule.hostIO.emit('players-update', mainModule.players);
                }
            }
            utils.logInfo(`Client disconnect: reason: ${reason}`);
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
            console.dir(requestedPlayerObj);
            const i = mainModule.players.findIndex(e => {
                return e.id === requestedPlayerObj.id;
            });

            if (!mainModule.players[i]) return utils.logError(`A client tried to send a join request with an invalid UUID. UUID: ${requestedPlayerObj.id}`);

            let packet = {};
            mainModule.players[i].nickname = requestedPlayerObj.nickname.length < 0 || requestedPlayerObj.nickname.length > 20 || requestedPlayerObj.nickname === 'unconnected' ? 'invalid-nickname' : requestedPlayerObj.nickname;
            if (requestedPlayerObj.connectionType === 'host') {
                mainModule.players[i].connectionType = 'host';
                mainModule.players[i].id = 'host';
                socket.gameUUID = 'host';
            } else {
                mainModule.players[i].connectionType = 'player';
            }
            utils.logInfo(`${mainModule.players[i].id === 'host' ? 'Host' : 'Player'} registered game UUID: ${mainModule.players[i].id} socketID: ${mainModule.players[i].socketID} with connectionType: ${mainModule.players[i].connectionType}\n\nPlayers now:\n`);
            console.dir(mainModule.players);

            socket.emit('join-confirm', mainModule.players[i]);
            let n;
            if (mainModule.players[i].id === 'host') {
                n = mainModule.players.findIndex(e => {
                    return e.socketID === mainModule.players[i].socketID.substring(6) && e.nickname === 'unconnected';
                });
            } else {
                n = mainModule.players.findIndex(e => {
                    return e.socketID === mainModule.players[i].socketID && e.nickname === 'unconnected';
                });
            }

            if (n > -1) {
                mainModule.players.splice(n, 1);
                utils.logDebug(`PATCH: deleted duplicate zombie client at index ${n}`);
            }
            // I forgot I did this lmao
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
        socket.on('vote-submit-ask', vote => runtime.manageVoteSubmit(socket, vote));

        socket.on('vote-start-ask', () => runtime.voteStartAsk(socket));
        socket.on('vote-end-ask', () => runtime.handleVoteEndAsk(socket));
        socket.on('round-end-ask', () => runtime.roundEndAsk(socket));
    },
};