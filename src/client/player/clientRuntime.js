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
    document.getElementById('countdown-text').style = '';
    document.getElementById('footer-div').innerHTML = `${player.nickname} - ${player.id} - Game status: running - Points: ${player.points}`;
    for (let i = roundInfo.firstRound ? 7 : 5; i >= 0; i--) {
        await timeoutAsync(() => {
            document.getElementById('countdown-text').innerHTML = `Ready? ${i}`;
        }, 1000);
    }

    // Setup inputs for round
    document.getElementById('connect-text').innerHTML = roundInfo.question;

    const br = document.createElement('br');
    br.setAttribute('id', 'debug-br');

    const e = document.createElement('textarea');
    e.setAttribute('rows', '3');
    e.setAttribute('cols', '30');
    e.setAttribute('id', 'answer-input');
    e.setAttribute('class', 'answer-input');
    e.setAttribute('placeholder', 'Write your answer and click submit when you\'re done');

    const submit = document.createElement('button');
    submit.setAttribute('id', 'submit-answer');
    submit.innerHTML = 'Submit Answer';

    const e2 = document.getElementById('user-list');
    const parent = e2.parentNode;

    parent.insertBefore(e, e2);
    parent.insertBefore(br, e2);
    parent.insertBefore(submit, e2);

    submit.addEventListener('click', submitAnswer);

    for (let i = roundInfo.timeLimit; i >= 0; i--) {
        const cont = await timeoutAsync(() => {
            document.getElementById('countdown-text').innerHTML = `Write your answer! ${i}`;
        }, 1000);

        if (!cont) {
            currentTimerCancel = false;
            break;
        }
    }

    removeUIElements();

    document.getElementById('countdown-text').style = 'display: none;';
}

function submitAnswer() {
    const ans = document.getElementById('answer-input');

    if (ans.value.length < 1 || ans.value.length > 500) {
        const exist = document.getElementById('warn-text');
        if (exist) return;
        const p = document.createElement('p');
        p.setAttribute('id', 'warn-text');
        p.innerHTML = 'Your answer must be between 1 and 500 characters!';

        const e = document.getElementById('countdown-text');
        const parent = e.parentNode;

        parent.insertBefore(p, e.nextSibling);

        window.setTimeout(() => {
            p.parentNode.removeChild(p);
        }, 5000);
    } else {
        document.getElementById('connect-text').innerHTML = 'Good answer! Waiting for other players to finish...';
        
        socket.emit('answer-submit', {player,text:ans.value});
    }
}

function handleVotingStage(answers) {
    currentTimerCancel = true;
    console.log('vote start');
    console.dir(answers);
    document.getElementById('connect-text').innerHTML = 'Now vote for the best answer.';
    const submittedAnswers = document.createElement('div');
    submittedAnswers.setAttribute('id', 'submitted-answers');
    const e = document.getElementById('user-list');
    const parent = e.parentNode;

    parent.insertBefore(submittedAnswers, e);

    for (let i = 0; i < answers.length; i++) {
        if (answers[i].id === player.id) continue;

        const button = document.createElement('button');
        button.setAttribute('id', `vote-btn-${answers[i].id}`);
        button.innerHTML = answers[i].answer;
        button.addEventListener('click', () => submitVote(button, socket));

        // IM RUNNING OUT OF TIME AAAAAAAAAa
        const br = document.createElement('br');
        const br2 = document.createElement('br');

        submittedAnswers.appendChild(button);
        submittedAnswers.appendChild(br);
        submittedAnswers.appendChild(br2);
    }

}

function submitVote(e, socket) {
    socket.emit('vote-submit-ask', e.id.substring(9));
}

function removeUIElements() {
    // this is called when the player has submitted an answer OR they run out of time
    const textBox = document.getElementById('answer-input');
    const submit = document.getElementById('submit-answer');

    if (textBox) textBox.parentNode.removeChild(textBox);
    if (submit) submit.parentNode.removeChild(submit);
}

function handleVoteFailure(packet) {

}

function handleVoteSuccess(vote) {
    const submit = document.getElementById('submitted-answers');
    if (submit) submit.innerHTML = '';
    document.getElementById('connect-text').innerHTML = 'Waiting for everyone to vote...';
}

function handleRevote(answers) {
    const submit = document.getElementById('submitted-answers');
    if (submit) submit.parentNode.removeChild(submit);
    document.getElementById('connect-text').innerHTML = 'Not enough info to determine the winners. We must have a revote.';

    setTimeout(() => {
        handleVotingStage(answers);
    }, 4000);
}

function showResults(packet) {
    console.log(player.id);
    console.dir(packet);
    const won = packet.winners.find(e => {
        return e.id === player.id;
    });

    console.log(`DEBUG: ${won}`);
    document.getElementById('connect-text').innerHTML = won ? 'Nice job! Your answer was voted into the top 5.' : 'Nice try, but your answer was not a winner.';

    const submittedAnswers = document.getElementById('submitted-answers');
    const humanLB = [];

    for (let i = 0; i < packet.leaderboard.length; i++) {
        humanLB.push(`${packet.leaderboard[i].name} -- ${packet.leaderboard[i].points}`);
    }

    submittedAnswers.innerHTML = humanLB.join('<br>');

    const i = packet.leaderboard.findIndex(e => {
        return e.id === player.id;
    });
    console.log(i);
    console.dir(packet.leaderboard);
    console.log('packet:');
    console.dir(packet);

    player.points = packet.leaderboard[i].points;
    console.log(packet.leaderboard[i].points);
    document.getElementById('footer-div').innerHTML = `${player.nickname} - ${player.id} - Game status: running - Points: ${player.points}`;
}

function endRound() {
    // Reset all UI elements for the next round
    currentTimerCancel = false;
    document.getElementById('connect-text').innerHTML = 'Waiting for a response from the server...';

    const submittedAnswers = document.getElementById('submitted-answers');

    submittedAnswers.innerHTML = '';
    submittedAnswers.parentNode.removeChild(submittedAnswers);
}

function endGame(players) {
    const submittedAnswers = document.createElement('p');
    const userList = document.getElementById('user-list');
    const humanLB = [];

    for (let i = 0; i < players.length; i++) {
        humanLB.push(`[${i + 1}] - ${players[i].nickname} - ${players[i].points}`);
    }

    document.getElementById('connect-text').innerHTML = 'Game Over!';
    submittedAnswers.innerHTML = humanLB.join('<br>');

    const parent = userList.parentNode;
    parent.insertBefore(submittedAnswers, userList);
}