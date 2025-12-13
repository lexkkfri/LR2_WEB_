// допоміжна функція для перевірки Email через Regex
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Показує помилку: підсвічує поле і додає текст
function showError(input, message) {
    const formGroup = input.parentElement;
    
    // 1. Встановлення класів для стилізації рамки та простору
    formGroup.classList.remove('success');
    formGroup.classList.add('error');
    // Оновлюємо стилі input, щоб прибрати стилі success, якщо вони були
    input.classList.remove('success');
    
    // 2. Створення або знаходження елемента повідомлення
    let errorDisplay = formGroup.querySelector('.error-message');
    if (!errorDisplay) {
        errorDisplay = document.createElement('div');
        errorDisplay.className = 'error-message';
        
        // !!! ВИПРАВЛЕННЯ: Вставляємо елемент ПІСЛЯ поля вводу (input)
        input.parentNode.insertBefore(errorDisplay, input.nextSibling);
    }
    
    // 3. Встановлення тексту та забезпечення видимості
    errorDisplay.innerText = message;
    errorDisplay.style.display = 'block'; // Гарантуємо, що він відображається
}

/// показує успіх: зелена рамка
function showSuccess(input) {
    const formGroup = input.parentElement;
    
    // !!! ВИПРАВЛЕННЯ: Додаємо клас успіху до батьківського елемента formGroup
    formGroup.classList.remove('error');
    formGroup.classList.add('success');
    
    // ВИДАЛЯЄМО клас error/success з самого input
    input.classList.remove('error');
    input.classList.remove('success');
    
    // видаляємо повідомлення про помилку, якщо воно є
    const errorDisplay = formGroup.querySelector('.error-message');
    if (errorDisplay) {
        errorDisplay.remove();
    }
}


// очищає всі візуальні ефекти помилок
function clearErrors(form) {
    const inputs = form.querySelectorAll('input');
    const formGroups = form.querySelectorAll('.form-group'); // Отримуємо всі батьківські контейнери
    const errorMessages = form.querySelectorAll('.error-message');
    
    inputs.forEach(input => {
        input.classList.remove('error');
        input.classList.remove('success');
    });
    
    // !!! ВИПРАВЛЕННЯ: Очищаємо класи з батьківських елементів
    formGroups.forEach(group => {
        group.classList.remove('error');
        group.classList.remove('success');
    });
    
    errorMessages.forEach(msg => msg.remove());
}

// загальна дія при успішній валідації
function handleFormSuccess(form, formData) {
    console.log('Form data:', formData);
    
    alert('Registration success. Welcome to Ordo!');
    
    form.reset();
    
    const formGroups = form.querySelectorAll('.form-group');
    
    formGroups.forEach(group => {
        group.classList.remove('success');
        const input = group.querySelector('input');
        if (input) {
            input.style.borderColor = ''; // Скидаємо рамку, якщо вона була встановлена інлайн
        }
    });
}