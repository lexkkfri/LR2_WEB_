document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    // Перевірка сесії (якщо вже увійшов - на головну)
    if (dbService.getCurrentUser() && !window.location.pathname.includes('index.html')) {
       window.location.href = 'index.html'; 
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // очищаємо попередні помилки (функція з utils.js)
            clearErrors(loginForm);
            
            let isValid = true;
            
            const emailUsernameInput = loginForm.querySelector('#email-username');
            const passwordInput = loginForm.querySelector('#password');
            const loginValue = emailUsernameInput.value.trim();
            // перевірка на заповення поля логіну
            if (emailUsernameInput.value.trim().length < 3) {
                showError(emailUsernameInput, "Введіть коректний логін або email");
                isValid = false;
            } else {
                showSuccess(emailUsernameInput);
            }

            // перевірка на заповнення поля пароля
            if (passwordInput.value.length === 0) {
                showError(passwordInput, "Введіть пароль");
                isValid = false;
            } else {
                showSuccess(passwordInput);
            }

            if (isValid) {
                try {
                    // await тепер працює коректно
                    const user = await dbService.loginUser(loginValue, passwordInput.value);
                    
                    console.log("Вхід успішний:", user);
                    window.location.href = 'index.html'; 
                } catch (error) {
                    if (error === 'Користувача не знайдено') {
                        showError(emailUsernameInput, error);
                    } else {
                        showError(passwordInput, error);
                    }
                }
            }
        });
    }
});