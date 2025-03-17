document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const errorMessages = document.getElementById('errorMessages');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const confirmPasswordValidation = document.getElementById('confirmPasswordValidation');
    const interestsSection = document.getElementById('interestsSection');
    const tagsContainer = document.getElementById('tagsContainer');
    const selectedTagsContainer = document.getElementById('selectedTagsContainer');
    const searchBar = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingMessage = document.getElementById('loadingMessage');

    let selectedTags = [];
    let userId = null;

    // Real-time password strength validation
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        updatePasswordStrengthIndicator(strength);
        if (confirmPasswordInput.value) {
            validatePasswordMatch();
        }
    });

    confirmPasswordInput.addEventListener('input', validatePasswordMatch);

    function checkPasswordStrength(password) {
        let strength = 0;
        if (password.length === 0) {
            passwordStrength.className = 'password-strength';
            return strength;
        }
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        return strength;
    }

    function updatePasswordStrengthIndicator(strength) {
        passwordStrength.className = 'password-strength';
        if (strength === 0) {
            passwordStrength.className += ' strength-weak';
        } else if (strength <= 2) {
            passwordStrength.className += ' strength-medium';
        } else {
            passwordStrength.className += ' strength-strong';
        }
    }

    function validatePasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (confirmPassword === '') {
            confirmPasswordValidation.textContent = '';
            confirmPasswordValidation.className = 'validation-message';
        } else if (password === confirmPassword) {
            confirmPasswordValidation.textContent = 'Passwords match';
            confirmPasswordValidation.className = 'validation-message success';
        } else {
            confirmPasswordValidation.textContent = 'Passwords do not match';
            confirmPasswordValidation.className = 'validation-message error';
        }
    }

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

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        fetch(window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1)) + '/signup', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Server response:', data);
            if (data.success) {
                userId = data.user_id;
                form.style.display = 'none';
                interestsSection.style.display = 'block';
                fetchInitialTags();
            } else {
                errorMessages.innerHTML = `<div>${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessages.innerHTML = '<div>An error occurred. Please try again later.</div>';
        });
    });

    function fetchInitialTags() {
        fetch('FetchTagsServlet?isRandom=true')
            .then(response => response.json())
            .then(data => {
                renderTags(data);
            })
            .catch(error => {
                console.error('Error fetching initial tags:', error);
                renderTags([]);
            });
    }

    function fetchTags(searchTerm) {
        fetch(`FetchTagsServlet?input=${encodeURIComponent(searchTerm)}&isRandom=false`)
            .then(response => response.json())
            .then(data => {
                renderTags(data);
            })
            .catch(error => {
                console.error('Error fetching tags:', error);
                renderTags([]);
            });
    }

    function renderTags(tags) {
        tagsContainer.innerHTML = '';
        const availableTags = tags.filter(t => !selectedTags.some(st => st.tag_id === t.tag_id));
        availableTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('tag');
            tagElement.textContent = tag.tag;
            tagElement.dataset.tagId = tag.tag_id;
            tagElement.addEventListener('click', () => {
                selectTag(tag);
            });
            tagsContainer.appendChild(tagElement);
        });
    }

    function renderSelectedTags() {
        selectedTagsContainer.innerHTML = '';
        selectedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('selected-tag');
            tagElement.textContent = tag.tag;
            tagElement.dataset.tagId = tag.tag_id;
            tagElement.addEventListener('click', () => {
                deselectTag(tag);
            });
            selectedTagsContainer.appendChild(tagElement);
        });
    }

    function selectTag(tag) {
        selectedTags.push(tag);
        fetchInitialTags();
        renderSelectedTags();
    }

    function deselectTag(tag) {
        selectedTags = selectedTags.filter(t => t.tag_id !== tag.tag_id);
        fetchInitialTags();
        renderSelectedTags();
    }

    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        if (searchTerm === '') {
            fetchInitialTags();
        } else {
            fetchTags(searchTerm);
        }
    });

    window.submitTags = function() {
        if (selectedTags.length > 0) {
            const tagIds = selectedTags.map(tag => tag.tag_id);

            // Hide interests section and show loading indicator
            interestsSection.style.display = 'none';
            loadingIndicator.style.display = 'block';
            loadingMessage.textContent = 'Creating account...';

            fetch('SubmitTagsServlet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `user_id=${userId}&tag_ids=${encodeURIComponent(JSON.stringify(tagIds))}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Tags submitted successfully');
                    // Simulate 2-second "Creating account..." delay
                    setTimeout(() => {
                        loadingMessage.textContent = 'Redirecting to login form...';
                        // Simulate 2-second "Redirecting..." delay
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    }, 2000);
                } else {
                    loadingIndicator.style.display = 'none';
                    interestsSection.style.display = 'block';
                    alert('Failed to save interests: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error submitting tags:', error);
                loadingIndicator.style.display = 'none';
                interestsSection.style.display = 'block';
                alert('An error occurred while saving interests');
            });
        } else {
            alert('Please select at least one interest');
        }
    };
});