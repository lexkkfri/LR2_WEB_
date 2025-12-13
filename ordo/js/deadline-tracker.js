let currentTasks = [];
let currentUserId = null;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// DOM Елементи
const taskForm = document.getElementById('taskForm');
const tasksContainer = document.getElementById('tasksContainer');
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');
const editTaskModal = document.getElementById('editTaskModal');
const editTaskForm = document.getElementById('editTaskForm');
const closeModalBtn = document.querySelector('.close-modal');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const overdueTasksEl = document.getElementById('overdue-tasks');
const taskSelectModal = document.getElementById('taskSelectModal');
const taskSelectTitle = document.getElementById('taskSelectTitle');
const taskSelectionList = document.getElementById('taskSelectionList');


//ДОПОМІЖНІ ФУНКЦІЇ

// Форматування дати
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Перевірка, чи прострочено завдання
function isOverdue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
}

// Перевірка, чи календарний день у минулому
function isPastDate(year, month, day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
}

//РОБОТА З ДАНИМИ (DB)
async function loadAndRender() {
    if (!currentUserId) return;
    try {
        //
        currentTasks = await dbService.loadTasks(currentUserId);
        renderTasks();
        renderCalendar();
        updateStats();
    } catch (error) {
        console.error('Помилка завантаження завдань:', error);
        tasksContainer.innerHTML = '<div class="empty-state">Помилка завантаження.</div>';
    }
}

async function saveTasks() {
}


// ФУНКЦІОНАЛ ТАСК-ТРЕКЕРА

// Відображення списку завдань
function renderTasks() {
    if (currentTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No tasks yet</h3>
                <p>Add your first task using the form above</p>
            </div>
        `;
        return;
    }

    // Сортуємо: спочатку не виконані, потім виконані
    const sortedTasks = currentTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    tasksContainer.innerHTML = sortedTasks.map(task => {
        const overdue = !task.completed && isOverdue(task.dueDate);
        const priorityClass = overdue ? 'priority-past-due' : `priority-${task.priority}`;
        const completedClass = task.completed ? 'completed' : '';
        const overdueIndicator = overdue ? '<span class="past-due-indicator">(OVERDUE)</span>' : '';
        
        return `
        <div class="task-card ${task.priority} ${overdue ? 'past-due' : ''} ${completedClass}">
            <div class="task-header">
                <div class="task-title">${task.title} ${overdueIndicator}</div>
                <div class="task-priority ${priorityClass}">
                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </div>
            </div>
            <div class="task-due">
                <i class="far fa-calendar"></i> Due: ${formatDate(task.dueDate)}
                ${task.completed ? '<span style="color: var(--color-accent-main); margin-left: 10px;"><i class="fas fa-check"></i> Completed</span>' : ''}
            </div>
            <p>${task.description}</p>
            <div class="task-actions">
                <button class="btn-edit btn" onclick="openEditModal(${task.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete btn" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Оновлення статистики
function updateStats() {
    const totalTasks = currentTasks.length;
    const completedTasks = currentTasks.filter(task => task.completed).length;
    const overdueTasks = currentTasks.filter(task => !task.completed && isOverdue(task.dueDate)).length;
    const pendingTasks = totalTasks - completedTasks;

    totalTasksEl.textContent = totalTasks;
    completedTasksEl.textContent = completedTasks;
    pendingTasksEl.textContent = pendingTasks;
    overdueTasksEl.textContent = overdueTasks;
}

// Обробник додавання нового завдання
taskForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    
    const newTask = {
        email: currentUserId,
        title,
        description,
        dueDate,
        priority,
        completed: false
    };
    
    try {
        await dbService.saveTask(newTask); 
        
        // Оновлюємо інтерфейс
        loadAndRender();
        
        // Скидаємо форму
        taskForm.reset();
        alert('Task added successfully!');
    } catch (error) {
        console.error('Помилка додавання завдання:', error);
        alert('Could not add task.');
    }
});

// Видалення завдання
window.deleteTask = async function(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            await dbService.deleteTask(taskId); //
            loadAndRender();
            alert('Task deleted successfully!');
        } catch (error) {
            console.error('Помилка видалення завдання:', error);
            alert('Could not delete task.');
        }
    }
}

// ФУНКЦІОНАЛ МОДАЛЬНОГО ВІКНА ТА ОНОВЛЕННЯ

// Відкриття модального вікна для редагування
window.openEditModal = function(taskId) {
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskDueDate').value = task.dueDate;
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskCompleted').checked = task.completed;
    
    editTaskModal.style.display = 'flex';
}

// Закриття модального вікна
closeModalBtn.addEventListener('click', function() {
    editTaskModal.style.display = 'none';
});

// Обробник оновлення завдання
editTaskForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const taskId = parseInt(document.getElementById('editTaskId').value);
    const title = document.getElementById('editTaskTitle').value;
    const description = document.getElementById('editTaskDescription').value;
    const dueDate = document.getElementById('editTaskDueDate').value;
    const priority = document.getElementById('editTaskPriority').value;
    const completed = document.getElementById('editTaskCompleted').checked;
    
    const updatedTask = {
        id: taskId,
        email: currentUserId, 
        title,
        description,
        dueDate,
        priority,
        completed
    };
    
    try {
        await dbService.saveTask(updatedTask);
        loadAndRender();
        editTaskModal.style.display = 'none';
        alert('Task updated successfully!');
    } catch (error) {
        console.error('Помилка оновлення завдання:', error);
        alert('Could not update task.');
    }
});


//ФУНКЦІОНАЛ КАЛЕНДАРЯ

// Відображення календаря
function renderCalendar() {
    // Оновлюємо відображення місяця/року
    currentMonthYear.textContent = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });

    calendarGrid.innerHTML = '';

    // Додаємо заголовки днів тижня
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day-header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Заповнюємо порожніми клітинками
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }

    // Додаємо клітинки для кожного дня місяця
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const today = new Date();
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Виділяємо сьогоднішній день
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // Виділяємо дні в минулому
        if (isPastDate(currentYear, currentMonth, day)) {
            dayElement.classList.add('past-due');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Додаємо завдання для цього дня
        const dayTasks = currentTasks.filter(task => task.dueDate === dateStr);
        
        // Контейнер для кружечків (DOTS)
        const dotContainer = document.createElement('div');
        dotContainer.className = 'calendar-day-content';
        // для мобільних версій завдання у вигляді кружечків
        if (window.innerWidth <= 768) {
             dayTasks.forEach(task => {
                const overdue = !task.completed && isOverdue(task.dueDate);
                
                // Створюємо DOT (кружечок)
                const dot = document.createElement('div');
                dot.className = `task-dot ${task.completed ? 'completed-dot' : task.priority} ${overdue ? 'past-due' : ''}`;
                dot.title = `${task.title} - ${task.priority.toUpperCase()}`;
                
                // Додаємо кружечок до контейнера
                dotContainer.appendChild(dot);
            });

            dayElement.appendChild(dotContainer);
        
            // Додаємо атрибут для кліку
            if (dayTasks.length > 0) {
                dayElement.classList.add('has-tasks');
                dayElement.setAttribute('data-date', dateStr);
            }
        } else {
            dayTasks.forEach(task => {
                const overdue = !task.completed && isOverdue(task.dueDate);
                const taskElement = document.createElement('div');
                taskElement.className = `task-item ${task.priority} ${overdue ? 'past-due' : ''}`;
                taskElement.textContent = task.title;
                taskElement.title = `${task.title} - ${task.priority} priority${overdue ? ' (OVERDUE)' : ''}`;
                taskElement.addEventListener('click', () => openEditModal(task.id));
                dayElement.appendChild(taskElement);
            });
        }

        calendarGrid.appendChild(dayElement);
    }
}

// Навігація календарем
prevMonthBtn.addEventListener('click', function() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

nextMonthBtn.addEventListener('click', function() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

todayBtn.addEventListener('click', function() {
    currentDate = new Date();
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderCalendar();
});


//ЛОГІКА МОБІЛЬНОГО ВІКНА ВИБОРУ ЗАВДАНЬ

// Обробник кліку на день календаря
calendarGrid.addEventListener('click', function(e) {
    const dayElement = e.target.closest('.calendar-day');

    if (!dayElement || !dayElement.classList.contains('has-tasks') || window.innerWidth > 768) {
        return; 
    }

    const dateStr = dayElement.getAttribute('data-date');
    const tasksOnDay = currentTasks.filter(task => task.dueDate === dateStr);
    
    // Якщо завдання одне: відкриваємо одразу вікно редагування
    if (tasksOnDay.length === 1) {
        window.openEditModal(tasksOnDay[0].id);
        return;
    }

    // Якщо завдань декілька: відкриваємо вікно вибору
    const dateFormatted = new Date(dateStr).toLocaleDateString('uk-UA', { 
        month: 'long', 
        day: 'numeric' 
    });
    taskSelectTitle.textContent = `Tasks for ${dateFormatted}`;
    taskSelectionList.innerHTML = '';

    tasksOnDay.forEach(task => {
        const li = document.createElement('li');
        li.setAttribute('data-task-id', task.id);
        const overdue = !task.completed && isOverdue(task.dueDate);
        let priorityText;
        let priorityClass;
        
        if (task.completed) {
            priorityText = 'Done';
            priorityClass = 'priority-low'; 
        } else if (overdue) {
            priorityText = 'Overdue';
            priorityClass = 'priority-past-due';
        } else {
            priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            priorityClass = `priority-${task.priority}`;
        }
        
        li.innerHTML = `
            <span>${task.title}</span>
            <span class="task-priority-indicator ${priorityClass}">
                ${priorityText}
            </span>
        `;
        taskSelectionList.appendChild(li);
    });

    taskSelectModal.style.display = 'flex';
});

// Обробник кліку на елемент списку вибору
taskSelectionList.addEventListener('click', function(e) {
    const listItem = e.target.closest('li[data-task-id]');
    if (!listItem) return;
    
    const taskId = parseInt(listItem.getAttribute('data-task-id'));
    
    taskSelectModal.style.display = 'none';
    window.openEditModal(taskId);         
});

// Обробник закриття модального вікна вибору
if (taskSelectModal) {
    taskSelectModal.querySelector('.close-modal').addEventListener('click', function() {
        taskSelectModal.style.display = 'none';
    });
}


// ІНІЦІАЛІЗАЦІЯ ДОДАТКУ
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = dbService.getCurrentUser();
    
    if (!currentUser) {
        //
        window.location.href = 'login.html';
        return;
    }
    
    currentUserId = currentUser.email; 
    
    const avatarEls = document.querySelectorAll('.avatar'); 
    const initials = currentUser.username.slice(0, 2).toUpperCase();
    avatarEls.forEach(avatar => {
        avatar.innerText = initials;
    });

    loadAndRender();
    
   
    window.addEventListener('resize', () => {
        if ((window.innerWidth > 768 && window.innerWidth - 150 < 768) || 
            (window.innerWidth <= 768 && window.innerWidth + 150 > 768)) {
            renderCalendar();
        }
    });
});