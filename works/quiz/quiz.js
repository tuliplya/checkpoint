'use strict';

const DELAY_AFTER_CLICK = 2000; 
const LEAVE_STEP = 250;         
const LEAVE_TIME = 700;         
const READ_TIME = 3500;         
const ADD_STEP = 150;           

const questions = [
    {
        text: 'Если человека назвали мордофиля, то это…',
        explanation: 'Ну зачем же вы так... В Этимологическом словаре русского языка Макса Фасмера поясняется, что мордофилей называют чванливого человека. Ну а «чванливый» — это высокомерный, тщеславный.',
        answers: [
            { text: 'Значит, что он тщеславный.', correct: true },
            { text: 'Значит, что у него лицо как у хряка.', correct: false },
            { text: 'Значит, что чумазый.', correct: false }
        ]
    },
    {
        text: '«Да этот Ярополк — фуфлыга!» Что не так с Ярополком?',
        explanation: 'Точно! Словарь Даля говорит, что фуфлыгой называют невзрачного малорослого человека. А еще так называют прыщи.',
        answers: [
            { text: 'Он маленький и невзрачный.', correct: true },
            { text: 'Он тот еще алкоголик.', correct: false },
            { text: 'Он не держит свое слово.', correct: false }
        ]
    },
    {
        text: 'Если человека прозвали пятигузом, значит, он…',
        explanation: 'Может сесть сразу на пять стульев. Согласно Этимологическому словарю русского языка Макса Фасмера, пятигуз — это ненадежный, непостоянный человек.',
        answers: [
            { text: 'Не держит слово.', correct: true },
            { text: 'Изменяет жене', correct: false },
            { text: 'Без гроша в кармане.', correct: false }
        ]
    },
    {
        text: 'Кто такой шлындра?',
        explanation: 'Да! В Словаре русского арго «шлындрать» означает бездельничать, шляться.',
        answers: [
            { text: 'Обманщик.', correct: false },
            { text: 'Нытик.', correct: false },
            { text: 'Бродяга.', correct: true }
        ]
    },
    {
        text: 'В каком случае про человека можно сказать, что он охренел (в смысле "обнаглел/перешёл границы"), а не просто удивился?',
        explanation: 'Слово «охренел» многозначно, оно означает «обнаглел, потерял совесть».',
        answers: [
            { text: 'Он без спроса берёт твои вещи и делает вид, что так и надо.', correct: true },
            { text: 'Он в наглую лезет без очереди и ещё возмущается, что его не пропускают.', correct: true },
            { text: 'Он съел много хрена и искренне удивился: «Какой жгучий, вот это да!»', correct: false },
            { text: 'В осеннем лесу наблюдается завихрение листьев.', correct: false }
        ]
    }
];

function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function shake(node) {
    node.classList.remove('shake', 'appearing');
    void node.offsetWidth; 
    node.classList.add('shake');
}

const area = document.getElementById('quiz-area');         
const answersArea = document.getElementById('answers-area'); 
const finishMsg = document.getElementById('finish-msg');
const statsBox = document.getElementById('stats');

const items = shuffle(questions).map(q => ({
    q: q,
    result: null,   
    head: null,
    mark: null
}));

let activeIdx = null;  
let busy = false;      
let finished = false;  
let reviewIdx = null;  

document.addEventListener('animationend', e => {
    if (e.animationName === 'shake') e.target.classList.remove('shake');
    if (e.animationName === 'appear') e.target.classList.remove('appearing');
});

function createQuestion(pos) {
    const s = items[pos];

    const head = create('button', 'q-head appearing');
    head.type = 'button';

    const mark = create('span', 'q-mark');
    mark.setAttribute('aria-hidden', 'true');

    head.append(
        create('span', 'q-num', (pos + 1) + '.'),   
        create('span', 'q-text', s.q.text),
        mark
    );

    s.head = head;
    s.mark = mark;

    head.addEventListener('click', () => onQuestionClick(pos));
    return head;
}

async function renderQuestions() {
    for (let i = 0; i < items.length; i++) {
        area.append(createQuestion(i));
        await sleep(ADD_STEP);
    }
}

function onQuestionClick(pos) {
    const s = items[pos];
    shake(s.head);

    if (busy) return;

    if (finished) {
        toggleReview(pos);
        return;
    }

    if (s.result !== null) return;
    if (activeIdx !== null) return;

    openQuestion(pos);
}

const quizBox = document.querySelector('.quiz');
const narrow = window.matchMedia('(max-width: 54em)');
let anchorHead = null; 

function alignAnswers(head) {
    anchorHead = head;
    if (narrow.matches) {
        answersArea.style.marginTop = '';
        head.after(answersArea);
    } else {
        if (answersArea.parentElement !== quizBox) quizBox.append(answersArea);
        const fontSize = parseFloat(getComputedStyle(answersArea).fontSize);
        answersArea.style.marginTop = (head.offsetTop / fontSize) + 'em';
    }
}

function realign() {
    if (anchorHead && answersArea.childElementCount > 0) alignAnswers(anchorHead);
}
narrow.addEventListener('change', realign);
window.addEventListener('resize', realign);

function openQuestion(pos) {
    const s = items[pos];
    activeIdx = pos;
    alignAnswers(s.head);
    s.head.classList.add('active');
    area.classList.add('has-active');

    shuffle(s.q.answers).forEach((answer, i) => {
        const block = create('button', 'answer appearing');
        block.type = 'button';
        block.style.animationDelay = (i * 120) + 'ms';
        block.append(
            create('span', 'answer__text', answer.text),
            create('span', 'explain', s.q.explanation)
        );
        block.addEventListener('click', () => onAnswerClick(pos, answer, block));
        answersArea.append(block);
    });
}

async function onAnswerClick(pos, answer, block) {
    if (busy || finished) return;
    busy = true;

    const s = items[pos];
    block.classList.add('chosen');
    shake(block);

    await sleep(DELAY_AFTER_CLICK);

    const blocks = Array.from(answersArea.children);
    const ok = answer.correct;
    s.result = ok ? 'ok' : 'fail';
    setMark(s, ok);

    if (ok) {
        block.classList.add('win');
        await leave(blocks.filter(b => b !== block));
        await sleep(READ_TIME);
        await leave([block]);
    } else {
        block.classList.add('bad');
        await leave(blocks);
    }

    answersArea.replaceChildren();

    s.head.classList.remove('active');
    s.head.classList.add('done', s.result);
    area.classList.remove('has-active');
    activeIdx = null;
    busy = false;

    if (items.every(it => it.result !== null)) finish();
}

function setMark(s, ok) {
    s.mark.textContent = ok ? '✓' : '✗';
    s.mark.classList.add(ok ? 'ok' : 'fail');
    s.head.classList.add(ok ? 'ok' : 'fail');
}

async function leave(blocks) {
    blocks.forEach((b, i) => {
        b.style.transitionDelay = (i * LEAVE_STEP) + 'ms';
        b.classList.add('leave');
    });
    await sleep(blocks.length * LEAVE_STEP + LEAVE_TIME);
}

function finish() {
    finished = true;

    const right = items.filter(it => it.result === 'ok').length;

    finishMsg.textContent = 'Вопросы закончились';
    finishMsg.hidden = false;

    statsBox.textContent = 'Правильных ответов: ' + right + ' из ' + items.length;
    statsBox.append(create('small', null, 'Нажми на вопрос, чтобы увидеть правильный ответ.'));
    statsBox.hidden = false;

    area.classList.add('review-mode');
}

function toggleReview(pos) {
    const same = reviewIdx === pos;

    if (reviewIdx !== null) {
        items[reviewIdx].head.classList.remove('active');
        answersArea.replaceChildren();
        reviewIdx = null;
    }
    if (same) return;

    const s = items[pos];
    reviewIdx = pos;
    s.head.classList.add('active');
    alignAnswers(s.head);

    s.q.answers.filter(a => a.correct).forEach(answer => {
        const block = create('div', 'answer review');
        block.append(
            create('span', 'answer__text', answer.text),
            create('span', 'explain', s.q.explanation)
        );
        answersArea.append(block);
    });
}

renderQuestions();
