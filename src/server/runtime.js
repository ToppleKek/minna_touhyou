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
    }
};