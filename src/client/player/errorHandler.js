function handleConnectionError(error) {
    toastr.error(`Connection error: ${error.message}`, 'WebSocket Error Handler');
}

function handleGenericSocketError(error) {
    toastr.error(`General WebSocket error: ${error.message}`, 'WebSocket Error Handler');
}

function handleReconnectAttempt(attempt) {
    toastr.info(`Attempting to reconnect to the server... Attempt: ${attempt}`, 'WebSocket Error Handler');

    document.getElementById('user-controls').innerHTML = `<em>Lost connection to the server. Attempting to reconnect... Attempt: ${attempt}<br>Your page will automatically refresh if a connection is esablished.</em>`;
    document.getElementById('footer-div').innerHTML = `Lost connection to the server. Reconnect attempt: ${attempt}`;
}