function timeoutAsync(callback, time) {
    return new Promise((resolve, reject) => {
        window.setTimeout(() => {
            callback();
            resolve(true);
        }, time);
    });
}

async function handleRound(roundInfo) {
    for (let i = roundInfo.firstRound ? 7 : 5; i >= 0; i--) {
        await timeoutAsync(() => {
            document.getElementById('countdown-text').innerHTML = `Ready? ${i}`;
        }, 1000);
    }

    document.getElementById('connect-text').innerHTML = roundInfo.question;

    const e = document.createElement('INPUT');
    e.setAttribute('type', 'text');
    e.setAttribute('id', 'answer-input');

    const e2 = document.getElementById('user-list');
    const parent = e2.parentNode;

    parent.insertBefore(e, e2);

    for (let i = roundInfo.timeLimit; i >= 0; i--) {
        await timeoutAsync(() => {
            document.getElementById('countdown-text').innerHTML = `Write your answer! ${i}`;
        }, 1000);
    }
}

function submitAnswer() {

}