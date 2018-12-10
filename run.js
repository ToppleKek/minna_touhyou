const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const connectionHandler = require('./src/server/connect.js');
const utils = require('./src/server/utils.js');

module.exports.hostIO = io.of('/host');
module.exports.playerIO = io.of('');
module.exports.players = [];
module.exports.currentGame = {};

app.use(express.static(`${__dirname}/src/client/player`));
app.get('/', (request, result) => {
    result.sendFile(`${__dirname}/src/client/player/client.html`);
});


app.get('/host/*', (request, result) => {
    // The way express works doesnt make sense to me here.
    // Instead of sending /sr/client/host/request we send it without the host.
    // Otherwise it requests /host/host/
    // This is related to the app.use call for static hosting but I dont feel like looking into it right now.
    // So this works fine.
    result.sendFile(`${__dirname}/src/client/${request.path}`);
});


module.exports.hostIO.on('connection', connectionHandler.connect);
module.exports.playerIO.on('connection', connectionHandler.connect);

http.listen(3000, () => {
    utils.logError('this is a sample error');
    utils.logInfo('Now listening on port 3000');
});