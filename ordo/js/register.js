document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // очищаємо попередні помилки (функція з utils.js)
            clearErrors(registerForm);
            
            let isValid = true;
            const formData = {};

            const usernameInput = registerForm.querySelector('#username');
            const emailInput = registerForm.querySelector('#email');
            const passwordInput = registerForm.querySelector('#password');
            const confirmPasswordInput = registerForm.querySelector('#confirm-password');

            // валідація імені
            if (usernameInput.value.trim().length < 3) {
                showError(usernameInput, "Username should contain at least 3 characters");
                isValid = false;
            } else {
                formData.username = usernameInput.value.trim();
                showSuccess(usernameInput);
            }

            // валідація Email
            if (!validateEmail(emailInput.value)) {
                showError(emailInput, "Enter a valid Email (for example: user@example.com)");
                isValid = false;
            } else {
                formData.email = emailInput.value.trim();
                showSuccess(emailInput);
            }

            // валідація пароля
            if (passwordInput.value.length < 6) {
                showError(passwordInput, "Password should contain at least 6 characters");
                isValid = false;
            } else {
                showSuccess(passwordInput);
            }

            // валідація підтвердження пароля
            if (confirmPasswordInput.value === '') {
                showError(confirmPasswordInput, "Confirm Password");
                isValid = false;
            } else if (confirmPasswordInput.value !== passwordInput.value) {
                // Якщо не порожнє, але не співпадає
                showError(confirmPasswordInput, "Passwords do not match");
                isValid = false;
            } else {
                showSuccess(confirmPasswordInput);
            }

            // Якщо все добре
            if (isValid) {
                const userData = {
                    username: usernameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value 
                };

                try {
                    // Виклик функції з db.js
                    await dbService.registerUser(userData);
                    await dbService.loginUser(userData.email, userData.password);
                    
                    alert('Account successfully created!');
                    window.location.href = 'index.html'; 
                } catch (error) {
                    // Якщо помилка (наприклад, такий email вже є)
                    showError(emailInput, error);
                    // Або вивести загальне повідомлення
                    alert("Registration error: " + error);
                } 
            }
        });
    }
});