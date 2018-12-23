function timeoutAsync(callback, time) {
    return new Promise((resolve, reject) => {
        window.setTimeout(() => {
            callback();
            resolve(true);
        }, time);
    });
}

async function handleRound(roundInfo) {
    let i = roundInfo.firstRound ? 7 : 5;
	for (; i >= 0; i--) {
		await timeoutAsync(() => {
			document.getElementById('countdown-text').innerHTML = `Ready? ${i}`;
		}, 1000);
	}

	document.getElementById('connect-text').innerHTML = roundInfo.question;
}