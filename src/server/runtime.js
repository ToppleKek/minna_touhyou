const utils = require('./utils.js');
const mainModule = require('../../run.js');

module.exports = {
    gameStart(socket) {
        utils.logInfo('The game should start now');
        // This should setup the server to start sending questions to the host.
        socket.on('round-start-ask', () => module.exports.mainGame(socket));
    },

    async mainGame(socket) {
        for (let i = 0; i < mainModule.currentGame.gameSetQuestions.length; i++) {
            await this.manageRound(socket, mainModule.currentGame.gameSetQuestions[i], i === 0);
        }
    },

    manageRound(socket, questionObj, firstRound) {
        return new Promise((resolve, reject) => {
            if (firstRound) {
                setTimeout(() => {
                    questionObj.firstRound = firstRound;
                    mainModule.hostIO.emit('round-start', questionObj);
                    mainModule.playerIO.emit('round-start', {
                        question:questionObj.question,
                        timeLimit:questionObj.timeLimit,
                        firstRound: questionObj.firstRound,
                    });
                }, 7000); // We should probably wait when its the first round because of the rules
                          // The rules take a little while to fade out, so we wait before starting the game
            } else {
                mainModule.hostIO.emit('round-start', questionObj);
                mainModule.playerIO.emit('round-start', {
                    question:questionObj.question,
                    timeLimit:questionObj.timeLimit,
                    firstRound
                });
            }

            socket.on('vote-start-ask', () => { 
                if (socket.handshake.headers.referer.endsWith('/host/') && socket.gameUUID === 'host') {
                    const playerSafeAnswers = [];
                    for (let i = 0; i < mainModule.players.length; i++) {
                        if (mainModule.players[i].id === 'host' || !mainModule.players[i].currentRoundAnswer) continue;
                        // I think it's safe to trust them with the other player's UUID's; They should have never gotten a list of who's who.
                        // Unless they decided to memorize the UUID then figure out how the game works then figure out how to extract the ID...
                        playerSafeAnswers.push({id:mainModule.players[i].id,answer:mainModule.players[i].currentRoundAnswer});
                    }
                    setTimeout(() => {
                        utils.logInfo('Start voting...');
                        mainModule.hostIO.emit('vote-start', mainModule.players);
                        mainModule.playerIO.emit('vote-start', playerSafeAnswers);
                    }, 2000); // Wait a little to let everyone see that time is up
                } else {
                    utils.logWarn(`A client that is not the host attempted to start the voting stage! Client: ${socket.gameUUID} ID: ${socket.id}`);
                }
            });

            socket.on('calc-score', results => {

            });

            socket.on('round-end-ask', () => {

            });
        });
    },

    manageAnswerSubmit(socket, answer) {
        const player = mainModule.players.find(e => {
            return e.id === answer.player.id && e.socketID === socket.id;
        });

        const i = mainModule.players.findIndex(e => {
            return e.id === answer.player.id && e.socketID === socket.id;
        });

        // store the players current answer in the player object, this will get reset at the beginning of every round
        if (i >= 0) mainModule.players[i].currentRoundAnswer = answer.text;

        utils.logInfo(`Player: ${player.nickname} - ${player.id} submitted: ${answer.text}`);

        // inform the host that someone has submitted an answer and that it should display it on screen
        mainModule.hostIO.emit('answer-submit', {answer, players: mainModule.players});
        socket.emit('answer-confirm');
    },

    manageVoteSubmit(socket, vote) {
        utils.logInfo(`User: ${socket.gameUUID} voted for: ${vote}`);
        if (socket.gameUUID === vote) utils.logWarn(`This user just tried to vote for their own answer!`);
    }
};