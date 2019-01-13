const utils = require('./utils.js');
const mainModule = require('../../run.js');

module.exports = {
    roundEnd: false,

    gameStart(socket) {
        utils.logInfo('The game should start now');
        // This should setup the server to start sending questions to the host.
        socket.on('round-start-ask', () => module.exports.mainGame(socket));
    },

    async mainGame(socket) {
        for (let i = 0; i < mainModule.currentGame.gameSetQuestions.length; i++) {
            await this.manageRound(socket, mainModule.currentGame.gameSetQuestions[i], i === 0, i, mainModule.currentGame.gameSetQuestions.length);
        }
        // Who cares now, the game is over
        const newPlayers = utils.sortPlayers(mainModule.players, 'points');
        mainModule.hostIO.emit('game-end', newPlayers);
        mainModule.playerIO.emit('game-end', newPlayers);
        utils.logInfo('Game Over, ^C to exit...');
    },

    manageRound(socket, questionObj, firstRound, i, gameLen) {
        return new Promise(async (resolve, reject) => {
            if (firstRound) {
                setTimeout(() => {
                    questionObj.firstRound = firstRound;
                    questionObj.roundNumber = i + 1;
                    questionObj.gameLen = gameLen;
                    mainModule.hostIO.emit('round-start', questionObj);
                    mainModule.playerIO.emit('round-start', {
                        question:questionObj.question,
                        timeLimit:questionObj.timeLimit,
                        firstRound: questionObj.firstRound,
                    });
                }, 7000); // We should probably wait when its the first round because of the rules
                          // The rules take a little while to fade out, so we wait before starting the game
            } else {
                questionObj.roundNumber = i + 1;
                questionObj.gameLen = gameLen;
                mainModule.hostIO.emit('round-start', questionObj);
                mainModule.playerIO.emit('round-start', {
                    question:questionObj.question,
                    timeLimit:questionObj.timeLimit,
                    firstRound
                });
            }
            
            await module.exports.pollRoundOver();
            resolve(true);
        });
    },

    voteStartAsk(socket) {
        utils.logWarn('vote-start-ask');
        if (socket.handshake.headers.referer.endsWith('/host/') && socket.gameUUID === 'host') {
            const playerSafeAnswers = [];
            for (let i = 0; i < mainModule.players.length; i++) {
                if (mainModule.players[i].id === 'host' || !mainModule.players[i].currentRoundAnswer) continue;
                mainModule.players[i].votes = 0;
                mainModule.players[i].voted = false;
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
    },

    roundEndAsk(socket) {
        for (let i = 0; i < mainModule.players.length; i++) {
            mainModule.players[i].votes = 0;
            mainModule.players[i].voted = false;
            mainModule.players[i].currentRoundAnswer = null;
        }

        mainModule.hostIO.emit('round-end');
        mainModule.playerIO.emit('round-end');

        // Wait a little for the clients to reset their playfields
        setTimeout(() => {
            module.exports.roundEnd = true;
        }, 2000);
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
        const n = mainModule.players.findIndex(e => {
            return e.id === socket.gameUUID;
        });

        if (mainModule.players[n].voted) return utils.logWarn(`User: ${socket.gameUUID} - ${socket.id} tried to vote a second time!`);
        else mainModule.players[n].voted = true;
        utils.logInfo(`User: ${socket.gameUUID} voted for: ${vote}`);
        if (socket.gameUUID === vote) utils.logWarn(`This user just tried to vote for their own answer!`);
        else {
            const i = mainModule.players.findIndex(e => {
                return e.id === vote;
            });

            mainModule.players[i].votes++;
            mainModule.hostIO.emit('vote-submit', {vote,players:mainModule.players});
        }

        let endVote = true;

        for (let i = 0; i < mainModule.players.length; i++) {
            utils.logInfo(`Voted? ${mainModule.players[i].voted}`);
            if (!mainModule.players[i].voted && mainModule.players[i].id !== 'host') {
                endVote = false;
                break;
            }
        }

        if (endVote) {
            utils.logInfo(`Finished voting round. Calling manageVoteTotals() to determine if another round is reqired...`);
            this.manageVoteTotals(socket);
        }
    },

    manageVoteTotals(socket) {
        for (let i = 0; i < mainModule.players.length; i++) {
            // Remove all people with no votes
            if (mainModule.players[i].votes === 0) {
                mainModule.players[i].currentRoundAnswer = null;
            }
        }

        const newPlayers = utils.sortPlayers(mainModule.players, 'votes');
        console.dir(newPlayers);
        const voteNums = [];

        for (let i = 0; i < newPlayers.length; i++) voteNums.push(newPlayers[i].votes);

        // Find the lowest vote number
        const lowestVote = Math.min(...voteNums);
        let lowestAns = 0;
        // Find how many answers have the lowest vote number
        for (let i = 0; i < newPlayers.length; i++) {
            if (newPlayers[i].votes <= lowestVote && newPlayers[i].id !== 'host') lowestAns++;
        }
        // Determine if we need another vote. If there are more than 5 answers left, have a revote because theres enough competition
        if (newPlayers.length - lowestAns > 5) {
            // Revote
            utils.logInfo('We must have a revote!');
            const playerSafeAnswers = [];

            for (let i = 0; i < newPlayers.length; i++) {
                // Reset all players and remove required players
                if (newPlayers[i].votes <= lowestVote && newPlayers[i].id !== 'host') newPlayers[i].currentRoundAnswer = null;
                mainModule.players[i].votes = 0;
                mainModule.players[i].voted = false;

                if (mainModule.players[i].id === 'host' || !mainModule.players[i].currentRoundAnswer) continue;

                playerSafeAnswers.push({id:mainModule.players[i].id,answer:mainModule.players[i].currentRoundAnswer});
            }

            mainModule.players = newPlayers;
            mainModule.hostIO.emit('revote', mainModule.players);
            mainModule.playerIO.emit('revote', playerSafeAnswers);
        } else {
            utils.logInfo('We shall end the vote!');
            const sortedPlayers = utils.sortPlayers(mainModule.players, 'votes');
            console.dir(sortedPlayers);
            const playerSafeLeaderboard = [];
            const lonelyGame = sortedPlayers.length < 5 ? sortedPlayers.length : 5; // :(
            let points = 1000;

            for (let i = 0; i < lonelyGame; i++) {
                if (sortedPlayers[i].id === 'host' || !sortedPlayers[i].currentRoundAnswer) continue;
                sortedPlayers[i].points += points;
                points -= 150;
            }

            for (let i = 0; i < sortedPlayers.length; i++) {
                if (sortedPlayers[i].id === 'host') continue;
                // Reset all players for the next round
                sortedPlayers[i].currentRoundAnswer = null;
                sortedPlayers[i].votes = 0;
                sortedPlayers[i].voted = false;

                // I didn't really WANT to send IDs here but I guess we gotta...
                playerSafeLeaderboard.push({name:sortedPlayers[i].nickname,points:sortedPlayers[i].points,id:sortedPlayers[i].id});
            }

            mainModule.players = sortedPlayers;
            mainModule.hostIO.emit('vote-end', mainModule.players);
            mainModule.playerIO.emit('vote-end', {leaderboard:playerSafeLeaderboard, winners:playerSafeLeaderboard.slice(0, 4)});
        }
    },

    handleVoteEndAsk(socket) {
        utils.logInfo(`Client asked to end voting round! ${socket.gameUUID}`);
        const isHostSocket = socket.handshake.headers.referer.endsWith('/host/') && socket.gameUUID === 'host';
        if (isHostSocket) this.manageVoteTotals(socket);
    },

    pollRoundOver() {
        // Honestly I'm out of ideas
        return new Promise(async (resolve, reject) => {
            for (;;) {
                if (module.exports.roundEnd) {
                    module.exports.roundEnd = false;
                    break;
                }
                await utils.timeoutAsync(() => {
                    utils.logWarn('Polling roundEnd resulted in false');
                }, 1000);
            }

            resolve(true);
        });
    }
};