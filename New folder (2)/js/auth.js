// Authentication system
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
    }

    // Load users from localStorage
    loadUsers() {
        const users = localStorage.getItem('users');
        if (!users) {
            console.log('No users found, creating default users...');
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
                    username: 'user',
                    email: 'user@cinema-iran.ir',
                    firstName: 'کاربر',
                    lastName: 'عادی',
                    phone: '09187654321',
                    password: 'user123',
                    role: 'user',
                    createdAt: new Date().toISOString(),
                    isActive: true
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(users);
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
    }

    // Handle login
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate inputs
        if (!username || !password) {
            this.showNotification('❌ لطفاً همه فیلدها را پر کنید', 'error');
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
                this.loginUser(user);
                this.showNotification('✅ ورود موفقیت‌آمیز بود', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                // Login failed
                this.showNotification('❌ نام کاربری یا رمز عبور اشتباه است', 'error');
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
            this.loginUser(newUser);
            
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
    loginUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('loggedInUser', JSON.stringify(user)); // Keep for backward compatibility
        
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
        }, 3000);
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