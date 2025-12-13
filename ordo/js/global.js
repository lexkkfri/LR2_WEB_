
// ФУНКЦІЯ КЕРУВАННЯ ТЕМОЮ
function toggleDarkMode(isInit = false) {
    const body = document.body;
    
    // Перевіряємо поточний стан (або ініціалізуємо)
    let isDark = body.classList.contains('dark-theme');
    
    if (isInit) {
        // При ініціалізації: встановлюємо тему з localStorage
        const savedTheme = localStorage.getItem('ordo_theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            isDark = true;
        }
    } else {
        // При кліку: перемикаємо
        isDark = !isDark;
        body.classList.toggle('dark-theme');
        
        // Зберігаємо новий стан
        localStorage.setItem('ordo_theme', isDark ? 'dark' : 'light');
    }
    
    // Оновлення тексту кнопки 
    const toggleBtn = document.getElementById('toggle-dark-mode');
    if (toggleBtn) {
        toggleBtn.innerHTML = isDark 
            ? '<i class="fas fa-sun"></i> Toggle Light Mode'
            : '<i class="fas fa-moon"></i> Toggle Dark Mode';
    }
}

//НІЦІАЛІЗАЦІЯ ГЛОБАЛЬНИХ ЕЛЕМЕНТІВ
function initGlobalFeatures() {
    
    //Ініціалізація теми при завантаженні
    toggleDarkMode(true); 
    
    const currentUser = dbService.getCurrentUser();
    
    if (!currentUser) {
        return; 
    }
    
    // Відображення ініціалів у шапці
    const avatarEls = document.querySelectorAll('.avatar'); 
    const initials = currentUser.username.slice(0, 2).toUpperCase();
    avatarEls.forEach(avatar => {
        avatar.innerText = initials;
    });
    
    const avatarBtn = document.getElementById('avatar-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const toggleThemeBtn = document.getElementById('toggle-dark-mode');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Оновлення даних профілю у випадаючому меню
    const dropdownUsername = document.getElementById('dropdown-username');
    const dropdownEmail = document.getElementById('dropdown-email');
    if (dropdownUsername) dropdownUsername.innerText = currentUser.username;
    if (dropdownEmail) dropdownEmail.innerText = currentUser.email;

    //Обробник для відображення/приховування меню аватара
    if (avatarBtn && userDropdown) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            userDropdown.classList.toggle('visible');
        });

        // Закриття меню при кліку поза ним
        document.addEventListener('click', (e) => {
            if (userDropdown && userDropdown.classList.contains('visible') && e.target !== avatarBtn && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('visible');
            }
        });
    }
    
    // Обробник для перемикання теми
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDarkMode(false);
            if(userDropdown) userDropdown.classList.remove('visible');
        });
    }

    // Обробник для виходу
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dbService.logout();
        });
    }
}

document.addEventListener('DOMContentLoaded', initGlobalFeatures);