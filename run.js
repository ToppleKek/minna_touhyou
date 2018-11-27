const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const connectionHandler = require('./src/server/connect.js');
const utils = require('./src/server/utils.js');

module.exports.io = io;
module.exports.players = [];

app.use(express.static(`${__dirname}/src/client/`));
app.get('/', (request, result) => {
    result.sendFile(`${__dirname}/src/client/client.html`);
});

io.on('connection', connectionHandler.connect);

http.listen(3000, () => {
    utils.logError('this is a sample error');
    utils.logInfo('Now listening on port 3000');
});