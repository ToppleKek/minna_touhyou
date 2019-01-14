function sendPacketPlayer(socket, player) {
    let nickname = document.getElementById('nickname').value;
    if (nickname.length < 1 || nickname.length > 20) return document.getElementById('name-text').innerHTML = 'Your nickname must be between 1 and 20 characters long';
    const e = document.getElementById('hostButton');
    const eb = document.getElementById('playerButton');
    if (e) e.parentNode.removeChild(e);
    eb.parentNode.removeChild(eb);
    player.connectionType = 'player';
    player.nickname = nickname;
    socket.emit('join-ask', player);
    socket.on('join-confirm', packet => {
        const e = document.getElementById('nickname');
        const eb = document.getElementById('name-text');

        e.parentNode.removeChild(e);
        eb.parentNode.removeChild(eb);
        player.id = packet.id;
        player.points = packet.points;

        document.getElementById('connect-text').innerHTML = `Connected as a player. Your name is: ${player.nickname}`;
        document.getElementById('footer-div').innerHTML = `${player.nickname} - ${player.id} - Game status: waiting for players`;
    });
}