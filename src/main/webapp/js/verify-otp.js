document.addEventListener('DOMContentLoaded', function() {
    const otpForm = document.getElementById('otpForm');
    const otpInputs = document.querySelectorAll('.otp-input');
    const resendBtn = document.getElementById('resendBtn');
    const countdownEl = document.getElementById('countdown');
    const errorMessages = document.getElementById('errorMessages');
    let timeLeft = 300; // 5 minutes in seconds

    // Auto-focus and navigation for OTP inputs
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            if (this.value.length === 1) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value) {
                if (index > 0) {
                    otpInputs[index - 1].focus();
                }
            }
        });
    });

    // Countdown timer
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (timeLeft === 0) {
            resendBtn.disabled = false;
            document.getElementById('timer').style.display = 'none';
        } else {
            timeLeft--;
            setTimeout(updateTimer, 1000);
        }
    }
    updateTimer();

    // Handle form submission
    otpForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const otp = Array.from(otpInputs).map(input => input.value).join('');

        fetch('/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ otp })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/login';
            } else {
                errorMessages.innerHTML = `<div>${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessages.innerHTML = '<div>An error occurred. Please try again.</div>';
        });
    });

    // Handle resend OTP
    resendBtn.addEventListener('click', function() {
        fetch('/resend-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset timer
                timeLeft = 300;
                resendBtn.disabled = true;
                document.getElementById('timer').style.display = 'block';
                updateTimer();
                errorMessages.innerHTML = '<div class="success">OTP has been resent</div>';
            } else {
                errorMessages.innerHTML = `<div>${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessages.innerHTML = '<div>Failed to resend OTP. Please try again.</div>';
        });
    });
});