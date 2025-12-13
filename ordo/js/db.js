const DB_NAME = 'OrdoDB';
const DB_VERSION = 3; 
const STORE_USERS = 'users';
const STORE_USER_DATA = 'user_data'; 
const STORE_ARCHIVES = 'archived_days';
const STORE_DEADLINES = 'deadlines';

const dbService = {
    // відкриття бази даних
    openDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // сховище користувачів (Users)
                if (!db.objectStoreNames.contains(STORE_USERS)) {
                    db.createObjectStore(STORE_USERS, { keyPath: 'email' });
                }

                // сховище для поточних To-Do та Notes (один запис на користувача)
                if (!db.objectStoreNames.contains(STORE_USER_DATA)) {
                    // ключ - email користувача
                    db.createObjectStore(STORE_USER_DATA, { keyPath: 'email' }); 
                }

                // сховище для архівованих днів
                if (!db.objectStoreNames.contains(STORE_ARCHIVES)) {
                    // ID створюється автоматично
                    const archiveStore = db.createObjectStore(STORE_ARCHIVES, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    // додаємо індекс для швидкого пошуку по email користувача
                    archiveStore.createIndex('by_email', 'email', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORE_DEADLINES)) {
                    const deadlinesStore = db.createObjectStore(STORE_DEADLINES, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    // Додаємо індекс для пошуку завдань конкретного користувача
                    deadlinesStore.createIndex('by_email', 'email', { unique: false });
                    // Додаємо індекс для пошуку за датою (для календаря)
                    deadlinesStore.createIndex('by_dueDate', 'dueDate', { unique: false }); 
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject('Opening DB error: ' + event.target.error);
            };
        });
    },

    // АВТОРИЗАЦІЯ

    // Реєстрація
    registerUser: async function(userData) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_USERS], 'readwrite');
            const store = transaction.objectStore(STORE_USERS);

            const checkRequest = store.get(userData.email);

            checkRequest.onsuccess = () => {
                if (checkRequest.result) {
                    reject('Username is already taken.');
                } else {
                    const addRequest = store.add(userData);
                    addRequest.onsuccess = () => resolve(userData);
                    addRequest.onerror = (event) => reject('Adding user error: ' + event.target.error);
                }
            };
            checkRequest.onerror = (event) => reject('Checking in DB error: ' + event.target.error);
        });
    },

    // вхід користувача
    loginUser: async function(loginValue, password) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_USERS], 'readonly');
            const store = transaction.objectStore(STORE_USERS);
            
            let userFound = null;
            
            // використовуємо курсор, щоб шукати і по email, і по username
            const cursorRequest = store.openCursor(); 

            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const user = cursor.value;
                    if (user.email === loginValue || user.username === loginValue) {
                        userFound = user;
                    } else {
                        cursor.continue();
                        return;
                    }
                }

                if (userFound) {
                    if (userFound.password === password) {
                        delete userFound.password;
                        localStorage.setItem('ordo_user', JSON.stringify(userFound));
                        resolve(userFound);
                    } else {
                        reject('Incorrect password.');
                    }
                } else {
                    reject('User not found.');
                }
            };
            
            cursorRequest.onerror = () => reject('Searching error.');
        });
    },

    // отримання поточного користувача
    getCurrentUser: function() {
        const userStr = localStorage.getItem('ordo_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // вихід
    logout: function() {
        localStorage.removeItem('ordo_user');
        window.location.href = 'login.html';
    },

    // НОВІ МЕТОДИ ДЛЯ ГОЛОВНОЇ СТОРІНКИ (HOME)

    // збереження поточних даних (To-Do List, Daily Notes)
    saveUserData: async function(email, data) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_USER_DATA], 'readwrite');
            const store = transaction.objectStore(STORE_USER_DATA);
            
            const userData = { email, ...data }; 
            const request = store.put(userData); // put оновлює або додає

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Data saving error: ' + event.target.error);
        });
    },

    // завантаження поточних даних
    loadUserData: async function(email) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_USER_DATA], 'readonly');
            const store = transaction.objectStore(STORE_USER_DATA);
            
            const request = store.get(email);

            request.onsuccess = (event) => {
                // повертаємо знайдені дані або порожній об'єкт
                resolve(event.target.result || { todos: [], notes: '' });
            };
            request.onerror = (event) => reject('Data uploading error: ' + event.target.error);
        });
    },

    // збереження прогресу дня
    archiveDay: async function(email, data) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_ARCHIVES], 'readwrite');
            const store = transaction.objectStore(STORE_ARCHIVES);
            
            // додаємо email та дату до архіву
            const archiveData = { 
                email, 
                date: new Date().toISOString().slice(0, 10), // формат YYYY-MM-DD
                timestamp: Date.now(),
                ...data 
            };
            
            const request = store.add(archiveData);

            request.onsuccess = (event) => resolve(event.target.result); // Повертає ID
            request.onerror = (event) => reject('Archiving error: ' + event.target.error);
        });
    },
    // завантаження списку архівних днів
    loadArchivedDays: async function(email) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_ARCHIVES], 'readonly');
            const store = transaction.objectStore(STORE_ARCHIVES);
            const index = store.index('by_email');
            
            const keyRange = IDBKeyRange.only(email);
            const request = index.getAll(keyRange);

            request.onsuccess = (event) => {
                // Сортуємо від найновішого до найстарішого
                const archives = event.target.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(archives);
            };
            request.onerror = (event) => reject('Archive uploading error: ' + event.target.error);
        });
    },

    // завантаження архівованого дня
    loadArchivedDay: async function(archiveId) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_ARCHIVES], 'readonly');
            const store = transaction.objectStore(STORE_ARCHIVES);
            
            // ID має бути числом (archiveId)
            const request = store.get(archiveId); 

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => reject('Archive uploading error: ' + event.target.error);
        });
    }, 
    

    // видалення архівного дня
    deleteArchivedDay: async function(archiveId) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_ARCHIVES], 'readwrite');
            const store = transaction.objectStore(STORE_ARCHIVES);
            
            // ID має бути числом
            const request = store.delete(archiveId);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Archive deleting error: ' + event.target.error);
        });
    },

    // Додавання/оновлення завдання
    saveTask: async function(task) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_DEADLINES], 'readwrite');
            const store = transaction.objectStore(STORE_DEADLINES);
            const request = store.put(task); 

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject('Task saving error: ' + event.target.error);
        });
    },

    // Завантаження всіх завдань користувача
    loadTasks: async function(email) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_DEADLINES], 'readonly');
            const store = transaction.objectStore(STORE_DEADLINES);
            const index = store.index('by_email');
            
            const keyRange = IDBKeyRange.only(email);
            const request = index.getAll(keyRange);

            request.onsuccess = (event) => {
                // Сортуємо за датою виконання
                const tasks = event.target.result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                resolve(tasks);
            };
            request.onerror = (event) => reject('Tasks uploading error: ' + event.target.error);
        });
    },

    // Видалення завдання
    deleteTask: async function(taskId) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_DEADLINES], 'readwrite');
            const store = transaction.objectStore(STORE_DEADLINES);
            
            const request = store.delete(taskId);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Task deleting error: ' + event.target.error);
        });
    }
};