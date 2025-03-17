document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessages = document.getElementById('errorMessages');

    // Password toggle functionality
    window.togglePassword = function(inputId) {
        const input = document.getElementById(inputId);
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);

        const icon = input.nextElementSibling.querySelector('.eye-icon');
        if (type === 'text') {
            icon.style.fill = '#262626';
        } else {
            icon.style.fill = '#8e8e8e';
        }
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        fetch('api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Store user info if needed
                sessionStorage.setItem('userId', data.userId);
                sessionStorage.setItem('username', data.username);
                window.location.href = 'dashboard.html';
            } else {
                errorMessages.innerHTML = `<div class="error-message">${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessages.innerHTML = '<div class="error-message">An error occurred. Please try again later.</div>';
        });
    });
});