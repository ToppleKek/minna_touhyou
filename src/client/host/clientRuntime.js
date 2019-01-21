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

    document.body.style.animation = roundInfo.firstRound ? 'lightToDark 8s' : 'lightToDark 6s';
    for (let i = roundInfo.firstRound ? 7 : 5; i >= 0; i--) {
        await timeoutAsync(() => {
            document.getElementById('countdown-text').innerHTML = `Question ${roundInfo.roundNumber} of ${roundInfo.gameLen}. Ready? ${i}`;
        }, 1000);
    }

    document.body.style.animation = 'darkToLight 5s';
    if (roundInfo.bgUseImg) {
        const bgImg = document.getElementById('bg-image');
        bgImg.style.animation = '';
        bgImg.style.backgroundImage = `url('${roundInfo.bgURL}')`;
        bgImg.style.animation = 'fadeIn 5s';
    }
    connectText.innerHTML = `${roundInfo.question}<br><small>Extra Info: ${roundInfo.extraInfo}</small>`;
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

    console.log('emitting vote-start-ask');

    socket.emit('vote-start-ask');
}

function handleVotingStage(players) {
    console.log('vote start');
    const answerList = document.getElementById('submitted-answers');
    answerList.innerHTML = '';

    for (let i = 0; i < players.length; i++) {
        if (players[i].id === 'host' || !players[i].currentRoundAnswer) continue;

        const p = document.createElement('p');
        p.setAttribute('id', `submitted-${players[i].id}`);
        p.innerHTML = `${players[i].currentRoundAnswer} - 0`;

        answerList.appendChild(p);         
    }

    const button = document.createElement('button');

    button.innerHTML = 'End Voting Stage';
    button.setAttribute('id', 'end-round-button');
    button.addEventListener('click', () => {
        socket.emit('vote-end-ask');
    });

    answerList.appendChild(button);
}

function handleSubmitVote(vote, players) {
    const answerList = document.getElementById('submitted-answers');
    const children = answerList.getElementsByTagName('*');

    for (let i = 0; i < children.length; i++) {
        if (children[i].id.substring(10) === vote) {
            const n = players.findIndex(e => {
                return e.id === vote;
            });

            children[i].innerHTML = `${players[n].currentRoundAnswer} - ${players[n].votes}`;
        }
    }
}

function handleAnswer(packet) {
    const answerList = document.getElementById('submitted-answers');
    if (answerList.innerHTML === 'No answers yet.') answerList.innerHTML = ''; // Sometimes you just have to take shortcuts
    let n = 0;

    const p = document.createElement('p');
    const text = document.createTextNode(`"${packet.answer.text}" - Anon`);

    p.appendChild(text);
    answerList.appendChild(p);

    for (let i = 0; i < packet.players.length; i++) {
        if (packet.players[i].id === 'host' || !packet.players[i].currentRoundAnswer || packet.players[i].connectionType === 'unconnected') continue;
        else n++;
    }

    if (n >= packet.players.length - 1) {
        currentTimerCancel = true;
    }
}

function handleRevote(players) {
    document.getElementById('connect-text').innerHTML = 'Not enough info to determine the winners. We must have a revote.';

    setTimeout(() => {
        handleVotingStage(players);
    }, 4000);
}

function showResults(packet) {
    document.body.style.animation = 'lightToDark 5s';
    document.getElementById('bg-image').style.animation = 'fadeOut 4s';

    window.setTimeout(() => {
        const bgImg = document.getElementById('bg-image');
        document.body.style.animation = '';
        bgImg.style.animation = '';
        bgImg.style.backgroundImage = '';
        document.body.style.animation = 'darkToLight 3s';
    }, 4000);

    document.getElementById('connect-text').innerHTML = `Congratulations Winners, ${packet[0].nickname}'s answer was voted the best.`;

    const submittedAnswers = document.getElementById('submitted-answers');
    const submittedTable = document.createElement('table');

    const tbody = document.createElement('tbody');

    for (let i = 0; i < packet.length; i++) {
        const tr = document.createElement('tr');
        const th1 = document.createElement('th');
        const th2 = document.createElement('th');

        th1.innerHTML = escapeHtml(packet[i].nickname);
        th2.innerHTML = packet[i].points;

        tr.appendChild(th1);
        tr.appendChild(th2);

        tbody.appendChild(tr);
    }

    submittedTable.appendChild(tbody);

    submittedTable.setAttribute('id', 'submitted-answers');

    submittedAnswers.parentNode.replaceChild(submittedTable, submittedAnswers);

    const nextButton = document.createElement('button');
    nextButton.setAttribute('id', 'next-button');
    nextButton.innerHTML = 'Next Round';
    nextButton.addEventListener('click', sendEndRoundPacket);

    const parent = submittedTable.parentNode;

    parent.insertBefore(nextButton, submittedTable.nextSibling);
}

function sendEndRoundPacket() {
    document.getElementById('connect-text').innerHTML = 'Emitting round-end-ask; Waiting for a response from the server...';

    socket.emit('round-end-ask');
}

function endRound() {
    // Reset all UI elements for the next round
    currentTimerCancel = false;
    document.getElementById('connect-text').innerHTML = 'Waiting for a response from the server...';

    const nextButton = document.getElementById('next-button');
    const submittedAnswers = document.getElementById('submitted-answers');

    submittedAnswers.innerHTML = '';
    submittedAnswers.style = 'display: none;';

    nextButton.parentNode.removeChild(nextButton);
}

function endGame(players) {
    document.body.style.animation = 'lightToDark 4s alternate infinite';
    const submittedAnswers = document.getElementById('submitted-answers');
    const submittedTable = document.createElement('table');
    const tbody = document.createElement('tbody');

    for (let i = 0; i < players.length; i++) {
        const tr = document.createElement('tr');
        const th1 = document.createElement('th');
        const th2 = document.createElement('th');
        const th3 = document.createElement('th');

        th1.innerHTML = i + 1;
        th2.innerHTML = escapeHtml(players[i].nickname);
        th3.innerHTML = players[i].points;

        tr.appendChild(th1);
        tr.appendChild(th2);
        tr.appendChild(th3);

        tbody.appendChild(tr);
    }

    submittedTable.appendChild(tbody);

    submittedTable.setAttribute('id', 'submitted-answers');

    submittedAnswers.parentNode.replaceChild(submittedTable, submittedAnswers);

    document.getElementById('connect-text').innerHTML = 'Game Over!';
    submittedAnswers.style = '';
}