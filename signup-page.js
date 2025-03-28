// signup.js - JavaScript for the standalone signup page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form validation
    initializeSignupForm();
    
    // Setup password toggles
    setupPasswordToggles();
});

// Form validation and handling
function initializeSignupForm() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const phoneInput = document.getElementById('signup-phone');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    const termsCheckbox = document.getElementById('terms-agree');
    const submitButton = form.querySelector('button[type="submit"]');
    const feedbackContainer = form.querySelector('.form-feedback');
    
    // Setup password requirements checker
    setupPasswordRequirements(passwordInput);
    
    // Setup input validation
    setupInputValidation(nameInput, 'name-error', validateName);
    setupInputValidation(emailInput, 'email-error', validateEmail);
    setupInputValidation(phoneInput, 'phone-error', validatePhone);
    setupInputValidation(passwordInput, 'password-error', validatePassword);
    setupInputValidation(confirmPasswordInput, 'confirm-password-error', () => 
        validateConfirmPassword(passwordInput.value, confirmPasswordInput.value));
    
    // Setup terms checkbox validation
    termsCheckbox.addEventListener('change', () => {
        const errorElement = document.getElementById('terms-error');
        if (termsCheckbox.checked) {
            errorElement.textContent = '';
        } else {
            errorElement.textContent = 'You must agree to the terms and conditions';
        }
    });
    
    // Form submission handler
    form.addEventListener('submit', handleSignupFormSubmission);
}

// Setup password visibility toggles
function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Change icon
            const svg = this.querySelector('svg');
            if (type === 'text') {
                svg.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                svg.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    });
}

// Password requirements visualization 
function setupPasswordRequirements(passwordInput) {
    if (!passwordInput) return;
    
    const requirements = {
        'req-length': password => password.length >= 8,
        'req-uppercase': password => /[A-Z]/.test(password),
        'req-lowercase': password => /[a-z]/.test(password),
        'req-number': password => /\d/.test(password)
    };
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        
        // Update requirements list
        for (const [reqId, validateFunc] of Object.entries(requirements)) {
            const reqElement = document.getElementById(reqId);
            if (reqElement) {
                if (validateFunc(password)) {
                    reqElement.classList.add('valid');
                } else {
                    reqElement.classList.remove('valid');
                }
            }
        }
    });
}

// Setup input validation with error messaging
function setupInputValidation(inputElement, errorId, validationFunction) {
    if (!inputElement || !document.getElementById(errorId)) return;
    
    const errorElement = document.getElementById(errorId);
    
    inputElement.addEventListener('blur', function() {
        const result = validationFunction(this.value);
        if (!result.valid) {
            errorElement.textContent = result.message;
            this.classList.add('error');
            this.classList.remove('valid');
        } else {
            errorElement.textContent = '';
            this.classList.remove('error');
            this.classList.add('valid');
        }
    });
    
    inputElement.addEventListener('input', function() {
        if (this.classList.contains('error')) {
            const result = validationFunction(this.value);
            if (result.valid) {
                errorElement.textContent = '';
                this.classList.remove('error');
                this.classList.add('valid');
            }
        }
    });
}

// Validation functions
function validateName(name) {
    if (!name.trim()) {
        return { valid: false, message: 'Name is required' };
    }
    if (name.trim().length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters' };
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        return { valid: false, message: 'Name contains invalid characters' };
    }
    return { valid: true };
}

function validateEmail(email) {
    if (!email.trim()) {
        return { valid: false, message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
}

function validatePhone(phone) {
    if (!phone.trim()) {
        return { valid: false, message: 'Phone number is required' };
    }
    // Basic phone validation - allows for different formats
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) {
        return { valid: false, message: 'Invalid phone number format' };
    }
    return { valid: true };
}

function validatePassword(password) {
    if (!password) {
        return { valid: false, message: 'Password is required' };
    }
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain an uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain a lowercase letter' };
    }
    if (!/\d/.test(password)) {
        return { valid: false, message: 'Password must contain a number' };
    }
    return { valid: true };
}

function validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
        return { valid: false, message: 'Please confirm your password' };
    }
    if (password !== confirmPassword) {
        return { valid: false, message: 'Passwords do not match' };
    }
    return { valid: true };
}

// Form submission handler
function handleSignupFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const phoneInput = document.getElementById('signup-phone');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    const termsCheckbox = document.getElementById('terms-agree');
    const submitButton = form.querySelector('button[type="submit"]');
    const feedbackContainer = form.querySelector('.form-feedback');
    
    // Clear previous feedback
    feedbackContainer.textContent = '';
    feedbackContainer.className = 'form-feedback';
    
    // Validate all inputs
    const nameValid = validateName(nameInput.value).valid;
    const emailValid = validateEmail(emailInput.value).valid;
    const phoneValid = validatePhone(phoneInput.value).valid;
    const passwordValid = validatePassword(passwordInput.value).valid;
    const confirmPasswordValid = validateConfirmPassword(
        passwordInput.value, confirmPasswordInput.value
    ).valid;
    
    // Check terms agreement
    if (!termsCheckbox.checked) {
        document.getElementById('terms-error').textContent = 'You must agree to the terms and conditions';
    }
    
    // If any validation fails, stop form submission
    if (!nameValid || !emailValid || !phoneValid || !passwordValid || 
        !confirmPasswordValid || !termsCheckbox.checked) {
        
        // Trigger validation on all fields to show errors
        if (!nameValid) nameInput.dispatchEvent(new Event('blur'));
        if (!emailValid) emailInput.dispatchEvent(new Event('blur'));
        if (!phoneValid) phoneInput.dispatchEvent(new Event('blur'));
        if (!passwordValid) passwordInput.dispatchEvent(new Event('blur'));
        if (!confirmPasswordValid) confirmPasswordInput.dispatchEvent(new Event('blur'));
        
        feedbackContainer.textContent = 'Please fix the errors in the form';
        feedbackContainer.classList.add('error');
        
        // Scroll to the first error
        const firstErrorField = form.querySelector('.error');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstErrorField.focus();
        }
        
        return;
    }
    
    // Form is valid, start signup process
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    feedbackContainer.textContent = 'Creating your account...';
    feedbackContainer.classList.add('info');
    
    // In a real app, you would send this data to your server
    // For demo purposes, we'll use setTimeout to simulate server request
    simulateSignupRequest({
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        password: passwordInput.value
    });
}

// Simulate server signup request
function simulateSignupRequest(userData) {
    setTimeout(() => {
        try {
            // Create user data object - in a real app, this would come from your backend
            const user = {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                totalRides: 0,
                upcomingRides: 0
            };
            
            // Store in localStorage
            localStorage.setItem('userData', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
            
            // Show success
            const feedbackContainer = document.querySelector('.form-feedback');
            feedbackContainer.textContent = 'Account created successfully!';
            feedbackContainer.classList.remove('info', 'error');
            feedbackContainer.classList.add('success');
            
            // Reset button state
            const submitButton = document.querySelector('.signup-btn');
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
            
            // Show success modal
            showSuccessModal();
            
        } catch (error) {
            console.error('Error creating account:', error);
            
            // Handle errors
            const feedbackContainer = document.querySelector('.form-feedback');
            feedbackContainer.textContent = 'Error creating account. Please try again.';
            feedbackContainer.classList.remove('info', 'success');
            feedbackContainer.classList.add('error');
            
            // Reset button state
            const submitButton = document.querySelector('.signup-btn');
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    }, 2000); // Simulate network delay
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.opacity = '0';
    }
    
    // Fade in modal
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transition = 'opacity 0.3s ease';
        
        if (modalContent) {
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
            modalContent.style.transition = 'all 0.3s ease';
        }
    }, 10);
}
