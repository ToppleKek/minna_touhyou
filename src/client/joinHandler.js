function sendPacketPlayer(socket, player) {
    const e = document.getElementById('hostButton');
    const eb = document.getElementById('playerButton');
    e.parentNode.removeChild(e);
    eb.parentNode.removeChild(eb);
    socket.emit('join-ask', 'player');
    socket.on('join-confirm', packet => {
        player = packet;
        document.getElementById('connect-text').innerHTML = `Connected with id: ${player.id}`;
    });
}

function sendPacketHost(socket) {
    const e = document.getElementById('hostButton');
    const eb = document.getElementById('playerButton');
    e.parentNode.removeChild(e);
    eb.parentNode.removeChild(eb);
    socket.emit('join-ask', 'host');
    socket.on('join-confirm', packet => {
        player = packet;
        document.getElementById('connect-text').innerHTML = `Connected with id: ${player.id}`;
    });
}