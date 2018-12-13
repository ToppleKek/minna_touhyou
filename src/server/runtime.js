const utils = require('./utils.js');
const mainModule = require('../../run.js');

module.exports = {
    gameStart(socket) {
        utils.logInfo('The game should start now');
        // This should setup the server to start sending questions to the host.
        this.mainGame(socket);
    },

    async mainGame(socket) {
        for (let i = 0; i < mainModule.currentGame.gameSetQuestions.length; i++) {
            mainModule.hostIO.emit('round-start', mainModule.currentGame.gameSetQuestions[0]);
            mainModule.playerIO.emit('round-start', {
                question:mainModule.currentGame.gameSetQuestions[0].question,
                timeLimit:mainModule.currentGame.gameSetQuestions[0].timeLimit
            });
        }
    },

    manageRound(socket, question) {
        return new Promise((resolve, reject) => {
            
        });
    }
};