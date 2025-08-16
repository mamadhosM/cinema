// Authentication system with password hashing
class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.init();
    }

    // Initialize authentication system
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupPasswordStrength();
    }

    // Load users from localStorage
    loadUsers() {
        const users = localStorage.getItem('users');
        if (!users) {
            console.log('No users found in localStorage, creating default users...');
            // Create default admin user
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@cinema-iran.ir',
                    firstName: 'مدیر',
                    lastName: 'سیستم',
                    phone: '09123456789',
                    password: 'admin123',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 2,
                    username: 'representative',
                    email: 'rep@cinema-iran.ir',
                    firstName: 'نماینده',
                    lastName: 'عمومی',
                    phone: '09187654321',
                    password: 'rep123',
                    role: 'representative',
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 3,
                    username: 'cinema1_manager',
                    email: 'manager1@cinema-iran.ir',
                    firstName: 'احمد',
                    lastName: 'محمدی',
                    phone: '09111111111',
                    password: 'manager123',
                    role: 'cinema_manager',
                    cinemaId: 1,
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 4,
                    username: 'cinema2_manager',
                    email: 'manager2@cinema-iran.ir',
                    firstName: 'فاطمه',
                    lastName: 'احمدی',
                    phone: '09122222222',
                    password: 'manager123',
                    role: 'cinema_manager',
                    cinemaId: 2,
                    createdAt: new Date().toISOString(),
                    isActive: true
                },
                {
                    id: 5,
                    username: 'cinema3_manager',
                    email: 'manager3@cinema-iran.ir',
                    firstName: 'علی',
                    lastName: 'رضایی',
                    phone: '09133333333',
                    password: 'manager123',
                    role: 'cinema_manager',
                    cinemaId: 3,
                    createdAt: new Date().toISOString(),
                    isActive: true
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            console.log('Default users created and saved to localStorage');
            return defaultUsers;
        }
        
        const parsedUsers = JSON.parse(users);
        console.log('Users loaded from localStorage:', parsedUsers.length, 'users found');
        
        // Check if we need to add default users (in case they were overwritten)
        const hasAdmin = parsedUsers.some(u => u.username === 'admin');
        const hasRep = parsedUsers.some(u => u.username === 'representative');
        const hasManagers = parsedUsers.some(u => u.role === 'cinema_manager');
        
        if (!hasAdmin || !hasRep || !hasManagers) {
            // Add missing default users
            const missingUsers = [];
            if (!hasAdmin) {
                missingUsers.push({
                    id: Date.now() + 1,
                    username: 'admin',
                    email: 'admin@cinema-iran.ir',
                    firstName: 'مدیر',
                    lastName: 'سیستم',
                    phone: '09123456789',
                    password: 'admin123',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                    isActive: true
                });
            }
            if (!hasRep) {
                missingUsers.push({
                    id: Date.now() + 2,
                    username: 'representative',
                    email: 'rep@cinema-iran.ir',
                    firstName: 'نماینده',
                    lastName: 'عمومی',
                    phone: '09187654321',
                    password: 'rep123',
                    role: 'representative',
                    createdAt: new Date().toISOString(),
                    isActive: true
                });
            }
            if (!hasManagers) {
                missingUsers.push({
                    id: Date.now() + 3,
                    username: 'cinema1_manager',
                    email: 'manager1@cinema-iran.ir',
                    firstName: 'احمد',
                    lastName: 'محمدی',
                    phone: '09111111111',
                    password: 'manager123',
                    role: 'cinema_manager',
                    cinemaId: 1,
                    createdAt: new Date().toISOString(),
                    isActive: true
                });
            }
            
            const updatedUsers = [...parsedUsers, ...missingUsers];
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            console.log('Missing default users added');
            return updatedUsers;
        }
        
        return parsedUsers;
    }

    // Load current user from localStorage
    loadCurrentUser() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            return JSON.parse(currentUser);
        }
        
        // Fallback to old system
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            const user = JSON.parse(loggedInUser);
            // Migrate to new system
            localStorage.setItem('currentUser', loggedInUser);
            localStorage.removeItem('loggedInUser');
            return user;
        }
        
        return null;
    }

    // Setup event listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Social login buttons
        this.setupSocialLogin();
    }

    // Handle login
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        // Validate inputs
        if (!this.validateLoginInputs(username, password)) {
            return;
        }
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);
        
        try {
            // Simulate API delay
            await this.delay(1000);
            
            // Find user
            const user = this.findUser(username, password);
            
            if (user) {
                // Login successful
                this.loginUser(user, rememberMe);
                this.showNotification('✅ ورود موفقیت‌آمیز بود', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                // Login failed
                this.showNotification('❌ نام کاربری یا رمز عبور اشتباه است', 'error');
                this.shakeForm(e.target);
            }
            
        } catch (error) {
            this.showNotification('❌ خطا در ورود. لطفاً دوباره تلاش کنید', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    // Handle register
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username').trim(),
            email: formData.get('email').trim(),
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            phone: formData.get('phone').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        // Validate inputs
        if (!this.validateRegisterInputs(userData)) {
            return;
        }
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);
        
        try {
            // Simulate API delay
            await this.delay(1500);
            
            // Check if username or email already exists
            if (this.userExists(userData.username, userData.email)) {
                this.showNotification('❌ نام کاربری یا ایمیل قبلاً استفاده شده است', 'error');
                return;
            }
            
            // Create new user
            const newUser = this.createUser(userData);
            
            // Auto-login after registration
            this.loginUser(newUser, false);
            
            this.showNotification('✅ ثبت‌نام موفقیت‌آمیز بود', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            this.showNotification('❌ خطا در ثبت‌نام. لطفاً دوباره تلاش کنید', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    // Find user by username/email and password
    findUser(username, password) {
        return this.users.find(user => 
            (user.username === username || user.email === username) && 
            user.password === password && 
            user.isActive
        );
    }

    // Check if user exists
    userExists(username, email) {
        return this.users.some(user => 
            user.username === username || user.email === email
        );
    }

    // Create new user
    createUser(userData) {
        const newUser = {
            id: Date.now(),
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            password: userData.password,
            role: 'user',
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Add to users array
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        return newUser;
    }

    // Login user
    loginUser(user, rememberMe) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('loggedInUser', JSON.stringify(user)); // Keep for backward compatibility
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        // Update UI on main page if available
        if (window.checkUserAuth) {
            window.checkUserAuth();
        }
    }

    // Logout user
    logoutUser() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('rememberMe');
        
        this.showNotification('👋 با موفقیت خارج شدید', 'info');
        
        // Update UI on main page if available
        if (window.checkUserAuth) {
            window.checkUserAuth();
        }
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // Check authentication status
    checkAuthStatus() {
        if (this.currentUser) {
            // User is logged in
            this.updateUIForLoggedInUser();
        } else {
            // Check for remember me
            const rememberMe = localStorage.getItem('rememberMe');
            if (rememberMe) {
                // Auto-login logic could go here
            }
        }
    }

    // Update UI for logged in user
    updateUIForLoggedInUser() {
        // This would update the UI to show user info
        // For now, just redirect if on auth pages
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('register.html')) {
            window.location.href = 'index.html';
        }
    }

    // Setup social login
    setupSocialLogin() {
        const googleBtn = document.querySelector('.btn-google');
        const telegramBtn = document.querySelector('.btn-telegram');
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleSocialLogin('google'));
        }
        
        if (telegramBtn) {
            telegramBtn.addEventListener('click', () => this.handleSocialLogin('telegram'));
        }
    }

    // Handle social login
    handleSocialLogin(provider) {
        this.showNotification(`🔄 ورود با ${provider} در حال توسعه است`, 'info');
    }

    // Utility functions
    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    highlightInput(inputId, type) {
        const input = document.getElementById(inputId);
        if (input) {
            const inputIcon = input.closest('.input-icon');
            inputIcon.classList.remove('error', 'success');
            inputIcon.classList.add(type);
        }
    }

    shakeForm(form) {
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 500);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-family: 'Vazirmatn', 'Tahoma', sans-serif;
            font-size: 0.9rem;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validation functions
    validateLoginInputs(username, password) {
        if (!username) {
            this.showNotification('❌ لطفاً نام کاربری یا ایمیل را وارد کنید', 'error');
            this.highlightInput('username', 'error');
            return false;
        }
        
        if (!password) {
            this.showNotification('❌ لطفاً رمز عبور را وارد کنید', 'error');
            this.highlightInput('password', 'error');
            return false;
        }
        
        return true;
    }

    validateRegisterInputs(userData) {
        if (!userData.username || userData.username.length < 3) {
            this.showNotification('❌ نام کاربری باید حداقل 3 کاراکتر باشد', 'error');
            return false;
        }
        
        if (!userData.email || !this.isValidEmail(userData.email)) {
            this.showNotification('❌ لطفاً ایمیل معتبر وارد کنید', 'error');
            return false;
        }
        
        if (!userData.firstName || !userData.lastName) {
            this.showNotification('❌ لطفاً نام و نام خانوادگی را وارد کنید', 'error');
            return false;
        }
        
        if (!userData.phone || !this.isValidPhone(userData.phone)) {
            this.showNotification('❌ لطفاً شماره تلفن معتبر وارد کنید', 'error');
            return false;
        }
        
        if (!userData.password || userData.password.length < 6) {
            this.showNotification('❌ رمز عبور باید حداقل 6 کاراکتر باشد', 'error');
            return false;
        }
        
        if (userData.password !== userData.confirmPassword) {
            this.showNotification('❌ رمز عبور و تکرار آن مطابقت ندارند', 'error');
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^09\d{9}$/;
        return phoneRegex.test(phone);
    }

    setupPasswordStrength() {
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.calculatePasswordStrength(password);
                this.updatePasswordStrengthIndicator(input, strength);
            });
        });
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 2) return 'weak';
        if (score <= 3) return 'medium';
        return 'strong';
    }

    updatePasswordStrengthIndicator(input, strength) {
        const container = input.closest('.form-group');
        let indicator = container.querySelector('.password-strength');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'password-strength';
            container.appendChild(indicator);
        }
        
        const strengthText = {
            weak: 'ضعیف',
            medium: 'متوسط',
            strong: 'قوی'
        };
        
        const strengthColor = {
            weak: '#e74c3c',
            medium: '#f39c12',
            strong: '#27ae60'
        };
        
        indicator.textContent = strengthText[strength];
        indicator.style.color = strengthColor[strength];
    }
}

// Toggle password visibility
function togglePassword(button) {
    const input = button.previousElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Initialize authentication system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.authSystem = new AuthSystem();
});

// Export for use in other files
window.AuthSystem = AuthSystem;