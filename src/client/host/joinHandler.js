function sendPacketHost(socket) {
    let nickname = document.getElementById('nickname').value;
    if (nickname.length < 1 || nickname.length > 20 || nickname === 'unconnected') return document.getElementById('name-text').innerHTML = 'Your nickname must be between 1 and 20 characters long (It may also be invalid).';
    const e = document.getElementById('hostButton');

    e.parentNode.removeChild(e);

    player.connectionType = 'host';
    player.nickname = nickname;

    socket.emit('join-ask', player);

    socket.on('join-confirm', packet => {
        const e = document.getElementById('nickname');
        const eb = document.getElementById('name-text');

        e.parentNode.removeChild(e);
        eb.parentNode.removeChild(eb);

        document.getElementById('gameJsonFilePicker').style = "";
        document.getElementById('gameStartButton').style = "";
        player = packet;

        document.getElementById('connect-text').innerHTML = `Connected as the host. Your name is: ${player.nickname}`;
        document.getElementById('footer-div').innerHTML = `${player.nickname} - ${player.id} - Game status: waiting for players - Points: 0`;
    });
}

function sendPacketGameStart(socket) {
    if (document.getElementById('gameJsonFilePicker').files.length > 0) {
        const file = document.getElementById('gameJsonFilePicker').files[0];
        if (file.type !== 'application/json') return alert(`The file you uploaded is not of type application/json! Instead it is ${file.type}`);
        const reader = new FileReader();
        reader.onload = event => {
            let gameJson;
            try {
                gameJson = JSON.parse(event.target.result);
                socket.emit('game-start-ask', {game:gameJson});
                document.getElementById('connect-text').innerHTML = "Game starting... Emitting signals...";
            } catch (e) {
                alert(`The file you sent failed to parse. ${e}`);
            }
        }
        reader.readAsText(file);
    }
}