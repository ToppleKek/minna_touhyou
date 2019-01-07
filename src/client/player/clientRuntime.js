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
    for (let i = roundInfo.firstRound ? 7 : 5; i >= 0; i--) {
        await timeoutAsync(() => {
            document.getElementById('countdown-text').innerHTML = `Ready? ${i}`;
        }, 1000);
    }

    // Setup inputs for round
    document.getElementById('connect-text').innerHTML = roundInfo.question;

    const br = document.createElement('br');

    const e = document.createElement('input');
    e.setAttribute('type', 'text');
    e.setAttribute('id', 'answer-input');

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

        if (!cont) break;
    }

    document.getElementById('connect-text').innerHTML = 'Times up!';
    document.getElementById('countdown-text').style = 'display: none;';

    removeUIElements();
}

function submitAnswer() {
    socket.emit('answer-submit', {player,text:document.getElementById('answer-input').value});
}

function handleVotingStage(answers, socket) {
    currentTimerCancel = true;
    console.log('vote start');
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

        submittedAnswers.appendChild(button);
    }

}

function submitVote(e, socket) {
    console.dir(e);
    socket.emit('vote-submit', e.id.substring(9));
}

function removeUIElements() {
    // this is called when the player has submitted an answer OR they run out of time
    const textBox = document.getElementById('answer-input');
    const submit = document.getElementById('submit-answer');

    if (textBox) textBox.parentNode.removeChild(textBox);
    if (submit) submit.parentNode.removeChild(submit);

    document.getElementById('connect-text').innerHTML = 'Good answer! Waiting for other players to finish...';
}