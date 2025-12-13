const DISPLAY_EL = document.getElementById('timer-display');
const START_BTN = document.getElementById('start-btn');
const PAUSE_BTN = document.getElementById('pause-btn');
const DISCARD_BTN = document.getElementById('discard-btn');
const SKIP_BTN = document.getElementById('skip-btn');
const STUDY_INPUT = document.getElementById('study-minutes');
const REST_INPUT = document.getElementById('rest-minutes');
const TOTAL_SESSIONS_INPUT = document.getElementById('total-sessions');
const SESSION_DISPLAY_EL = document.getElementById('current-session-display');

// Режими
const MODE_STUDY = 'study';
const MODE_REST = 'rest';

let intervalId = null; 
let isPaused = true;
let totalSeconds = 0;
let currentMode = MODE_STUDY;
let currentSession = 0;
let totalSessions = 4; 


// ДОПОМІЖНІ ФУНКЦІЇ

// Форматування часу MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(remainingSeconds).padStart(2, '0');
    
    return `${minStr}:${secStr}`;
}

// Оновлення відображення сесії
function updateSessionDisplay() {
    if (SESSION_DISPLAY_EL) {
        SESSION_DISPLAY_EL.innerText = `${currentSession} / ${totalSessions}`;
    }
}
// Встановлення часу відповідно до поточного режиму
function setInitialTime() {
    //Оновлюємо загальну кількість сесій
    totalSessions = parseInt(TOTAL_SESSIONS_INPUT.value) || 4;

    const studyMinutes = parseInt(STUDY_INPUT.value) || 25;
    const restMinutes = parseInt(REST_INPUT.value) || 5;

    totalSeconds = (currentMode === MODE_STUDY) ? (studyMinutes * 60) : (restMinutes * 60);
    DISPLAY_EL.innerText = formatTime(totalSeconds);
    
    // Оновлюємо відображення сесії
    updateSessionDisplay();
    
    // Встановлюємо заголовок сторінки
    const modeName = currentMode === MODE_STUDY ? 'Study' : 'Rest';
    document.title = `${formatTime(totalSeconds)} (${modeName} ${currentSession}/${totalSessions}) | Ordo Timer`; 
}


// Перемикання режиму 
function switchMode() {
    pauseTimer(); 
    
    if (currentMode === MODE_STUDY) {
        // Завершено робочий період. Переходимо на відпочинок.
        currentMode = MODE_REST;
        
    } else if (currentMode === MODE_REST) {
        // Завершено відпочинок. Збільшуємо номер сесії.
        currentSession++;
        
        if (currentSession > totalSessions) {
            currentMode = MODE_STUDY; // Повертаємо, але зупиняємо
            discardTimer(true); // Скидаємо все і виводимо фінальне повідомлення
            return;
        }
        
        // Починаємо нову робочу сесію
        currentMode = MODE_STUDY;
    }
    
    // Додаємо CSS класи для візуального відображення
    document.body.classList.remove('mode-study', 'mode-rest');
    document.body.classList.add(`mode-${currentMode}`);
    
    // Встановлюємо час для нового режиму
    setInitialTime();
    
    // Автоматичний старт після зміни режиму
    startTimer(); 
}

// ОСНОВНА ЛОГІКА ТАЙМЕРА
function tick() {
    totalSeconds--;
    
    if (totalSeconds < 0) {
        switchMode();
        return;
    }
    
    DISPLAY_EL.innerText = formatTime(totalSeconds);
    
    const modeName = currentMode === MODE_STUDY ? 'Study' : 'Rest';
    document.title = `${formatTime(totalSeconds)} (${modeName} ${currentSession}/${totalSessions}) | Ordo Timer`;
}

function startTimer() {
    if (!isPaused || intervalId) return; 
    
    //Якщо це перший запуск, ініціалізуємо сесію
    if (currentSession === 0) {
        currentSession = 1; 
        updateSessionDisplay();
    }
    
    isPaused = false;
    intervalId = setInterval(tick, 1000); 
    
    // Оновлюємо стан кнопок
    START_BTN.disabled = true;
    PAUSE_BTN.disabled = false;
    SKIP_BTN.disabled = false;
    DISCARD_BTN.disabled = false;
    STUDY_INPUT.disabled = true;
    REST_INPUT.disabled = true;
    TOTAL_SESSIONS_INPUT.disabled = true;
    
    document.body.classList.add(`mode-${currentMode}`); // Встановлюємо початковий клас
    console.log('Timer started.');
}

function pauseTimer() {
    if (isPaused) return;

    clearInterval(intervalId);
    intervalId = null;
    isPaused = true;
    
    START_BTN.disabled = false;
    PAUSE_BTN.disabled = true;
    console.log('Timer paused.');
}

// Функція скидання, приймає флаг, чи був він завершений
function discardTimer(completed = false) {
    pauseTimer();
    
    currentSession = 0;
    currentMode = MODE_STUDY; 
    
    STUDY_INPUT.disabled = false;
    REST_INPUT.disabled = false;
    TOTAL_SESSIONS_INPUT.disabled = false;

    setInitialTime();
    
    // Оновлюємо стан кнопок
    START_BTN.disabled = false;
    PAUSE_BTN.disabled = true;
    SKIP_BTN.disabled = true;
    DISCARD_BTN.disabled = false;

    // Знімаємо клас режиму
    document.body.classList.remove('mode-study', 'mode-rest');
    
    if (completed) {
        alert(`🎉 Congratulations! You completed all ${totalSessions} sessions.`);
    }
    console.log('Timer discarded.');
}


// ІНІЦІАЛІЗАЦІЯ ТА ОБРОБНИКИ ПОДІЙ
document.addEventListener('DOMContentLoaded', () => {
    
    // Ініціалізація початкового часу
    setInitialTime(); 
    
    // Обробники для зміни налаштувань часу
    STUDY_INPUT.addEventListener('change', () => {
        if (isPaused) setInitialTime();
    });
    REST_INPUT.addEventListener('change', () => {
        if (isPaused) setInitialTime();
    });
    TOTAL_SESSIONS_INPUT.addEventListener('change', () => {
        if (isPaused) setInitialTime();
    });
    
    // Кнопки управління
    START_BTN.addEventListener('click', startTimer);
    PAUSE_BTN.addEventListener('click', pauseTimer);
    DISCARD_BTN.addEventListener('click', () => discardTimer(false));
    
    // Кнопка Skip (пропускає поточний режим)
    SKIP_BTN.addEventListener('click', switchMode);
    
    // Встановлюємо початковий стан кнопок
    PAUSE_BTN.disabled = true;
    SKIP_BTN.disabled = true;
    DISCARD_BTN.disabled = false; 
});