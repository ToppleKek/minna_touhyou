function timeoutAsync(callback, time) {
    return new Promise((resolve, reject) => {
        window.setTimeout(() => {
            if (currentTimerCancel) resolve(false);
            else {
                callback();
                resolve(true);
            }
        }, time);
    });
}

async function handleRound(roundInfo) {
    console.dir(roundInfo);
    const connectText = document.getElementById('connect-text');
    const countdownText = document.getElementById('countdown-text');
    const answerList = document.getElementById('submitted-answers');

    countdownText.style = '';

    for (let i = roundInfo.firstRound ? 7 : 5; i >= 0; i--) {
        await timeoutAsync(() => {
            document.getElementById('countdown-text').innerHTML = `Ready? ${i}`;
        }, 1000);
    }


    connectText.innerHTML = roundInfo.question;
    answerList.innerHTML = 'No answers yet.';
    answerList.style = '';
    countdownText.style = '';

    for (let i = roundInfo.timeLimit; i >= 0; i--) {
        const cont = await timeoutAsync(() => {
            countdownText.innerHTML = `Write your best answers! ${i}`;
        }, 1000);

        if (!cont) {
            currentTimerCancel = false;
            break;
        }
    }

    connectText.innerHTML = 'Time is up!';
    countdownText.style = 'display: none;';

    socket.emit('vote-start-ask');
}

function handleVotingStage(players) {
    console.log('vote start');
    const answerList = document.getElementById('submitted-answers');  
}

function handleAnswer(packet) {
    const answerList = document.getElementById('submitted-answers');
    if (answerList.innerHTML === 'No answers yet.') answerList.innerHTML = ''; // Sometimes you just have to take shortcuts
    let n = 0;

    const p = document.createElement('p');
    const text = document.createTextNode(`${packet.answer.text} - Anon`);

    p.appendChild(text);
    answerList.appendChild(p);

    for (let i = 0; i < packet.players.length; i++) {
        if (packet.players[i].id === 'host' || !packet.players[i].currentRoundAnswer) continue;
        else n++;
    }

    if (n >= packet.players.length - 1) {
        currentTimerCancel = true;
    }
}