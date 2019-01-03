function timeoutAsync(callback, time) {
    return new Promise((resolve, reject) => {
        window.setTimeout(() => {
            callback();
            resolve(true);
        }, time);
    });
}

async function handleRound(roundInfo) {
    console.dir(roundInfo);
    const connectText = document.getElementById('connect-text');
    const countdownText = document.getElementById('countdown-text');

    countdownText.style = '';

    for (let i = roundInfo.firstRound ? 7 : 5; i >= 0; i--) {
        await timeoutAsync(() => {
            document.getElementById('countdown-text').innerHTML = `Ready? ${i}`;
        }, 1000);
    }


    connectText.innerHTML = roundInfo.question;
    countdownText.style = '';

    for (let i = roundInfo.timeLimit; i >= 0; i--) {
        await timeoutAsync(() => {
            countdownText.innerHTML = `Write your best answers! ${i}`;
        }, 1000);
    }

    connectText.innerHTML = 'Time is up!';
    countdownText.style = 'display: none;';
}