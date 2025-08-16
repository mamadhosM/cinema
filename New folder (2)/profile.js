// Profile management system
let currentUser = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    setupEventListeners();
});

// Load user profile
function loadUserProfile() {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (!user) {
        // Redirect to login if no user
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    displayUserProfile(user);
}

// Display user profile
function displayUserProfile(user) {
    // Update profile form fields
    document.getElementById('firstName').value = user.firstName || '';
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('username').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    
    // Update profile header
    const profileHeader = document.querySelector('.profile-header h1');
    if (profileHeader) {
        profileHeader.textContent = `پروفایل ${user.firstName} ${user.lastName}`;
    }
    
    // Update user info display
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-details">
                <h3>${user.firstName} ${user.lastName}</h3>
                <p>@${user.username}</p>
                <p>${user.email}</p>
                <p>${user.phone}</p>
            </div>
        `;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Profile update form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Password change form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutProfile);
    }
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updatedData = {
        firstName: formData.get('firstName').trim(),
        lastName: formData.get('lastName').trim(),
        username: formData.get('username').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim()
    };
    
    // Validate inputs
    if (!validateProfileData(updatedData)) {
        return;
    }
    
    try {
        // Update user data
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex === -1) {
            showNotification('❌ کاربر یافت نشد', 'error');
            return;
        }
        
        // Check if username or email is already taken by another user
        const isDuplicate = users.some(u => 
            u.id !== currentUser.id && 
            (u.username === updatedData.username || u.email === updatedData.email)
        );
        
        if (isDuplicate) {
            showNotification('❌ نام کاربری یا ایمیل قبلاً استفاده شده است', 'error');
            return;
        }
        
        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            ...updatedData
        };
        
        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user
        currentUser = { ...currentUser, ...updatedData };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser)); // Keep for backward compatibility
        
        // Update display
        displayUserProfile(currentUser);
        
        showNotification('✅ پروفایل با موفقیت به‌روزرسانی شد', 'success');
        
    } catch (error) {
        showNotification('❌ خطا در به‌روزرسانی پروفایل', 'error');
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const passwordData = {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Validate inputs
    if (!validatePasswordData(passwordData)) {
        return;
    }
    
    try {
        // Verify current password
        if (passwordData.currentPassword !== currentUser.password) {
            showNotification('❌ رمز عبور فعلی اشتباه است', 'error');
            return;
        }
        
        // Update password
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex === -1) {
            showNotification('❌ کاربر یافت نشد', 'error');
            return;
        }
        
        // Update password
        users[userIndex].password = passwordData.newPassword;
        
        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user
        currentUser.password = passwordData.newPassword;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser)); // Keep for backward compatibility
        
        // Reset form
        e.target.reset();
        
        showNotification('✅ رمز عبور با موفقیت تغییر یافت', 'success');
        
    } catch (error) {
        showNotification('❌ خطا در تغییر رمز عبور', 'error');
    }
}

// Validate profile data
function validateProfileData(data) {
    if (!data.firstName || !data.lastName) {
        showNotification('❌ نام و نام خانوادگی الزامی است', 'error');
        return false;
    }
    
    if (!data.username || data.username.length < 3) {
        showNotification('❌ نام کاربری باید حداقل 3 کاراکتر باشد', 'error');
        return false;
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        showNotification('❌ لطفاً ایمیل معتبر وارد کنید', 'error');
        return false;
    }
    
    if (!data.phone || !isValidPhone(data.phone)) {
        showNotification('❌ لطفاً شماره تلفن معتبر وارد کنید', 'error');
        return false;
    }
    
    return true;
}

// Validate password data
function validatePasswordData(data) {
    if (!data.currentPassword) {
        showNotification('❌ لطفاً رمز عبور فعلی را وارد کنید', 'error');
        return false;
    }
    
    if (!data.newPassword || data.newPassword.length < 6) {
        showNotification('❌ رمز عبور جدید باید حداقل 6 کاراکتر باشد', 'error');
        return false;
    }
    
    if (data.newPassword !== data.confirmPassword) {
        showNotification('❌ رمز عبور جدید و تکرار آن مطابقت ندارند', 'error');
        return false;
    }
    
    return true;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone format
function isValidPhone(phone) {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
}

// Logout from profile
function logoutProfile() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
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

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'times-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Get notification color
function getNotificationColor(type) {
    const colors = {
        success: '#27ae60',
        warning: '#f39c12',
        error: '#e74c3c',
        info: '#3498db'
    };
    return colors[type] || '#3498db';
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

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
    
    .profile-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }
    
    .profile-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--bg-light);
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--bg-light);
        border-radius: var(--border-radius);
    }
    
    .user-avatar i {
        font-size: 4rem;
        color: var(--primary-color);
    }
    
    .user-details h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-dark);
    }
    
    .user-details p {
        margin: 0.25rem 0;
        color: var(--text-light);
    }
    
    .form-section {
        background: white;
        padding: 1.5rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        margin-bottom: 2rem;
    }
    
    .form-section h3 {
        margin-bottom: 1.5rem;
        color: var(--text-dark);
        border-bottom: 2px solid var(--bg-light);
        padding-bottom: 0.5rem;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-dark);
        font-weight: 500;
    }
    
    .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--bg-light);
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: var(--transition);
    }
    
    .form-group input:focus {
        outline: none;
        border-color: var(--primary-color);
    }
    
    .password-input {
        position: relative;
    }
    
    .password-toggle {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        padding: 0.25rem;
    }
    
    .password-toggle:hover {
        color: var(--primary-color);
    }
    
    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: var(--border-radius);
        font-size: 1rem;
        cursor: pointer;
        transition: var(--transition);
        text-decoration: none;
        display: inline-block;
        text-align: center;
    }
    
    .btn-primary {
        background: var(--primary-color);
        color: white;
    }
    
    .btn-primary:hover {
        background: var(--primary-dark);
        transform: translateY(-2px);
    }
    
    .btn-outline {
        background: transparent;
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
    }
    
    .btn-outline:hover {
        background: var(--primary-color);
        color: white;
    }
    
    .btn-danger {
        background: var(--danger-color);
        color: white;
    }
    
    .btn-danger:hover {
        background: var(--danger-dark);
    }
    
    .actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
    }
    
    @media (max-width: 768px) {
        .profile-container {
            padding: 1rem;
        }
        
        .user-info {
            flex-direction: column;
            text-align: center;
        }
        
        .actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(notificationStyles);