// پروفایل کاربر: ویرایش اطلاعات و رمز عبور
document.addEventListener('DOMContentLoaded', function () {
    // خواندن کاربر فعلی
    const user = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    // پر کردن فرم
    document.getElementById('profileFirstName').value = user.firstName || '';
    document.getElementById('profileLastName').value = user.lastName || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.phone || '';

    document.getElementById('profileForm').addEventListener('submit', function (e) {
        e.preventDefault();
        // اطلاعات جدید
        const firstName = document.getElementById('profileFirstName').value.trim();
        const lastName = document.getElementById('profileLastName').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const password = document.getElementById('profilePassword').value;

        // اعتبارسنجی ساده
        if (!firstName || !lastName || !email || !phone) {
            showNotification('همه فیلدها به جز رمز الزامی است', 'error');
            return;
        }
        // بروزرسانی کاربر در users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx].firstName = firstName;
            users[idx].lastName = lastName;
            users[idx].email = email;
            users[idx].phone = phone;
            if (password.length > 0) users[idx].password = password;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(users[idx]));
            localStorage.setItem('loggedInUser', JSON.stringify(users[idx])); // Keep for backward compatibility
            showNotification('تغییرات با موفقیت ذخیره شد', 'success');
        }
    });
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<div class="notification-content"><span>${message}</span></div>`;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; padding: 1rem 1.5rem;
        border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 10000; transform: translateX(100%);
        transition: transform 0.3s ease; max-width: 300px; font-family: 'Vazirmatn', 'Tahoma', sans-serif; font-size: 0.9rem;
    `;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => { document.body.removeChild(notification); }, 300);
    }, 3000);
}
function logoutProfile() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
}
function togglePassword(btn) {
    const input = btn.previousElementSibling;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}