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
    }
};