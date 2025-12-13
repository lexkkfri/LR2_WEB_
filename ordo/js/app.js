const TODO_LIST_ID = 'todo-list';
const TODO_FORM_ID = 'todo-form';
const TODO_INPUT_ID = 'todo-input';
const NOTES_INPUT_ID = 'daily-notes-input';
const ARCHIVED_LIST_ID = 'archived-list';

let currentTodos = [];
let currentUserId = null;


// Helper function to format date YYYY-MM-DD to a readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options); 
}

// Функція рендерингу To-Do списку
function renderTodoList(todos) {
    const listEl = document.getElementById(TODO_LIST_ID);
    if (!listEl) return;

    listEl.innerHTML = ''; 

    if (todos.length === 0) {
        listEl.innerHTML = '<li class="todo-item placeholder-item">To-Do list is empty. Add your first task!</li>';
    } else {
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.classList.add('todo-item');
            li.setAttribute('data-id', todo.id); 
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                <button class="delete-btn btn-icon"><i class="fas fa-trash"></i></button>
            `;
            listEl.appendChild(li);
        });
    }

    updateInsights(todos); 
}

// Функція рендерингу архівних днів
async function renderArchivedDays(email) {
    const listEl = document.getElementById(ARCHIVED_LIST_ID);
    if (!listEl) return;

    listEl.innerHTML = ''; 

    try {
        const archives = await dbService.loadArchivedDays(email);
        
        if (archives.length === 0) {
            listEl.innerHTML = '<li class="archived-item placeholder-item">There are no saved days yet.</li>';
        } else {
            archives.forEach(archive => {
                const li = document.createElement('li');
                li.classList.add('archived-item');
                li.setAttribute('data-id', archive.id); 
                li.innerHTML = `
                    <span class="archive-date">Date: ${formatDate(archive.date)}</span>
                    <span class="archive-stats">(${archive.completedCount}/${archive.totalCount} completed)</span>
                    <button class="delete-archive-btn btn-icon"><i class="fas fa-trash"></i></button>
                `;
                listEl.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Помилка завантаження архівів:', error);
        listEl.innerHTML = `<li class="archived-item placeholder-item error-item">Archives download error.</li>`;
    }
}

// Функція оновлення Daily Insights
function updateInsights(todos) {
    const insightsEl = document.querySelector('.insights');
    if (!insightsEl) return;
    
    const totalCount = todos.length;
    const completedCount = todos.filter(t => t.completed).length;
    
    let message1 = '';
    let message2 = '';
    
    if (totalCount === 0) {
        message1 = "You have no planned tasks. Set your priorities for today!";
        message2 = "Your daily progress is here.";
    } else if (completedCount === totalCount) {
        message1 = `You've completed all ${totalCount} tasks! Great work! 🎉`;
        message2 = "Daily progress: 100% completed!";
    } else if (completedCount > 0) {
        message1 = `Completed ${completedCount} of ${totalCount} tasks.`;
        const percentage = Math.round((completedCount / totalCount) * 100);
        message2 = `Keep up the work! You've completed ${percentage}% of total tasks.`;
    } else {
        message1 = `${totalCount} tasks planned for today. It's time to get down to work!`;
        message2 = "No tasks completed yet. You can do this!";
    }

    // оновлюємо вміст Insights
    insightsEl.innerHTML = `
        <div class="section-title">Daily Insights</div>
        <p>${message1}</p>
        <p>${message2}</p>
    `;
}

// Функція збереження поточного стану (To-Do + Notes) в БД
async function saveCurrentState() {
    if (!currentUserId) return;
    const notesInput = document.getElementById(NOTES_INPUT_ID); 
    
    const dataToSave = {
        todos: currentTodos,
        notes: notesInput ? notesInput.value : ''
    };
    
    try {
        await dbService.saveUserData(currentUserId, dataToSave);
        console.log('Current state (To-Do/Notes) has been successfully saved.');
    } catch (error) {
        console.error('Saving error:', error);
    }
}

// Функція завантаження даних
async function loadData(notesInputEl) {
    try {
        const userData = await dbService.loadUserData(currentUserId);
        
        // To-Do List
        currentTodos = userData.todos || [];
        renderTodoList(currentTodos);

        // Notes
        if (notesInputEl) {
            notesInputEl.value = userData.notes || '';
        }

        // Archived Days
        await renderArchivedDays(currentUserId);

    } catch (error) {
        console.error('Data initialization error:', error);
        alert('Data loading failed: ' + error);
    }
}


// ОСНОВНА ЛОГІКА ДОДАТКУ (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    
    // Елементи DOM 
    const todoForm = document.getElementById(TODO_FORM_ID);
    const todoInput = document.getElementById(TODO_INPUT_ID);
    const todoListEl = document.getElementById(TODO_LIST_ID);
    const notesInputEl = document.getElementById(NOTES_INPUT_ID); 
    const saveProgressBtn = document.getElementById('save-progress-btn'); 
    const archivedListEl = document.getElementById(ARCHIVED_LIST_ID);

    // АВТЕНТИФІКАЦІЯ ТА ВІДОБРАЖЕННЯ ПРОФІЛЮ
    const currentUser = dbService.getCurrentUser();
    
    if (!currentUser) {
        const isAuthPage = document.body.classList.contains('auth-page');
        if (!isAuthPage) {
            window.location.href = 'login.html';
        }
        return; 
    }
    
    currentUserId = currentUser.email; 
    
    // display User Data
    const displayName = document.getElementById('display-name');
    const displayEmail = document.getElementById('display-email');
    if (displayName) displayName.innerText = currentUser.username;
    if (displayEmail) displayEmail.innerText = currentUser.email;
    const initials = currentUser.username.slice(0, 2).toUpperCase();
    const avatarEls = document.querySelectorAll('.avatar-large'); // Тільки великий аватар
    avatarEls.forEach(avatar => {
        avatar.innerText = initials;
    });

    // завантаження даних 
    if (todoListEl) {
        loadData(notesInputEl); 
    }

    // ПОДІЇ TO-DO LIST
    // додавання завдання
    if (todoForm) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = todoInput.value.trim();
            if (text) {
                const newTodo = {
                    id: Date.now(), 
                    text: text,
                    completed: false
                };
                currentTodos.unshift(newTodo); 
                renderTodoList(currentTodos);
                saveCurrentState();
                todoInput.value = ''; 
            }
        });
    }

    // зміна статусу / видалення завдання (делегування)
    if (todoListEl) {
        todoListEl.addEventListener('click', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (!todoItem) return;

            const todoId = parseInt(todoItem.getAttribute('data-id'));
            
            // видалення
            if (e.target.closest('.delete-btn')) {
                if (confirm('Are you sure you want to delete this task?')) {
                    currentTodos = currentTodos.filter(t => t.id !== todoId);
                    renderTodoList(currentTodos);
                    saveCurrentState();
                }
                return;
            }

            // перемикання статусу
            const checkbox = todoItem.querySelector('.todo-checkbox');
            if (e.target === checkbox || e.target.classList.contains('todo-text')) {
                const todo = currentTodos.find(t => t.id === todoId);
                if (todo) {
                    todo.completed = !todo.completed; 
                    renderTodoList(currentTodos);
                    saveCurrentState();
                }
            }
        });
    }
    
    // ПОДІЇ NOTES (Автозбереження)
    if (notesInputEl) { 
        let saveTimer;
        notesInputEl.addEventListener('input', () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(saveCurrentState, 500); 
        });
    }

    // ПОДІЇ АРХІВУВАННЯ
    
    // збереження прогресу дня
    if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', async () => {
            if (!currentUserId) return;
            
            const totalCount = currentTodos.length;
            
            if (totalCount === 0) {
                 if (!confirm("No tasks for today. Still save the data?")) {
                    return;
                }
            }
            
            const notesInput = document.getElementById(NOTES_INPUT_ID); 
            const archiveData = {
                todos: currentTodos,
                notes: notesInput ? notesInput.value : '',
                totalCount: totalCount,
                completedCount: currentTodos.filter(t => t.completed).length,
            };

            try {
                // архівуємо дані
                await dbService.archiveDay(currentUserId, archiveData);
                
                // очищаємо поточний стан (для нового дня)
                currentTodos = [];
                if (notesInput) notesInput.value = '';
                await saveCurrentState(); 
                
                // перерендеринг
                renderTodoList(currentTodos);
                await renderArchivedDays(currentUserId);
                
                alert('Daily progress has been successfully saved!');

            } catch (error) {
                alert('Data saving error. Perhaps, you have already saved your progress.');
                console.error('Archiving error:', error);
            }
        });
    }
    
    // видалення архівного дня (делегування) і перегляд деталей
    if (archivedListEl) {
        archivedListEl.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-archive-btn');
            
            const archiveItem = e.target.closest('.archived-item');
            if (!archiveItem) return;

            const archiveId = parseInt(archiveItem.getAttribute('data-id')); 
            
            // логіка вилалення
            if (deleteBtn) {
                if (confirm('Are you sure you want to delete data for this day?')) {
                    try {
                        await dbService.deleteArchivedDay(archiveId);
                        await renderArchivedDays(currentUserId);
                        alert('Archived day has been successfully deleted.');
                    } catch (error) {
                        alert('Archive deleting error.');
                        console.error('Archive deleting error:', error);
                    }
                }
                return; 
            }
            
            // логіка перегляду
            if (e.target.closest('.archive-date') || e.target.closest('.archive-stats') || e.target === archiveItem) {
                try {
                    const archiveData = await dbService.loadArchivedDay(archiveId);
                    
                    if (archiveData) {
                        const dateFormatted = formatDate(archiveData.date);
                        
                        // Форматування списку справ для відображення в alert
                        let todosSummary = (archiveData.todos || [])
                                            .map(t => `${t.completed ? '[X]' : '[ ]'} ${t.text}`)
                                            .join('\n');
                        
                        // Вивід у консоль для розробника (повні дані)
                        console.log(`--- Archived Day: ${dateFormatted} ---`);
                        console.log('Notes:', archiveData.notes || 'No notes');
                        console.log('To-Dos:', archiveData.todos);
                        
                        // Спливаюче повідомлення для користувача
                        alert(
                            `Viewing Day: ${dateFormatted}\n` +
                            `-------------------------------\n` +
                            `Notes:\n${archiveData.notes || 'No notes'}\n\n` +
                            `To-Do List (${archiveData.completedCount}/${archiveData.totalCount}):\n${todosSummary || 'Empty'}\n\n` +
                            `Check the console (F12) for full task details.`
                        );
                    } else {
                        alert('Error: Archive data not found in DB.');
                    }
                } catch (error) {
                    alert('Error loading archive data.');
                    console.error('Loading archive data error:', error);
                }
            }
        });
    }
    
});