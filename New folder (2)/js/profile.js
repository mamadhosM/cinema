// پروفایل کاربر: ویرایش اطلاعات و رمز عبور
document.addEventListener('DOMContentLoaded', function () {
    // خواندن کاربر فعلی
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
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
            localStorage.setItem('loggedInUser', JSON.stringify(users[idx]));
            showNotification('تغییرات با موفقیت ذخیره شد', 'success');
        }
    });

    // Render my bookings
    renderMyBookings(user.id);
});

function renderMyBookings(userId) {
    const list = document.getElementById('myBookingsList');
    if (!list) return;
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]')
        .filter(b => (b.user?.id || b.userId) === userId)
        .sort((a,b) => new Date(b.date) - new Date(a.date));

    if (bookings.length === 0) {
        list.innerHTML = `<p style="text-align:center;color:#777">رزروی یافت نشد</p>`;
        return;
    }

    list.innerHTML = bookings.map(b => {
        const movieTitle = b.movie?.title || '-';
        const cinemaName = b.cinema?.name || '-';
        const when = new Date(b.date).toLocaleString('fa-IR');
        const seats = (b.seats || []).join(', ');
        const price = (b.totalPrice || 0).toLocaleString('fa-IR');
        return `
            <div class="booking-item" data-id="${b.id}">
                <div class="booking-main">
                    <span class="badge">کد: ${b.code || b.id}</span>
                    <strong>${movieTitle}</strong>
                    <span>– ${cinemaName}</span>
                </div>
                <div class="booking-meta">
                    <span><i class="fas fa-calendar"></i> ${when}</span>
                    <span><i class="fas fa-chair"></i> ${seats || '-'}</span>
                    <span><i class="fas fa-money-bill"></i> ${price} تومان</span>
                </div>
                <div class="booking-actions">
                    <button class="btn btn-outline btn-sm" onclick="editBooking(${b.id})"><i class="fas fa-edit"></i> ویرایش</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBooking(${b.id})"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
        `;
    }).join('');

    injectBookingsStyles();
}

function deleteBooking(id) {
    const confirmDelete = confirm('آیا از حذف این رزرو اطمینان دارید؟');
    if (!confirmDelete) return;
    const all = JSON.parse(localStorage.getItem('bookings') || '[]');
    const next = all.filter(b => b.id !== id);
    localStorage.setItem('bookings', JSON.stringify(next));
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    renderMyBookings(user.id);
    showNotification('رزرو حذف شد', 'success');
}

function editBooking(id) {
    const all = JSON.parse(localStorage.getItem('bookings') || '[]');
    const idx = all.findIndex(b => b.id === id);
    if (idx === -1) return;
    const b = all[idx];
    const newTime = prompt('ساعت جدید را وارد کنید (HH:MM):', (new Date(b.date)).toTimeString().slice(0,5));
    if (!newTime) return;
    // Update only time of booking
    const dateObj = new Date(b.date);
    const [hh, mm] = newTime.split(':');
    if (!hh || !mm) return;
    dateObj.setHours(parseInt(hh), parseInt(mm), 0, 0);
    b.date = dateObj.toISOString();
    all[idx] = b;
    localStorage.setItem('bookings', JSON.stringify(all));
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    renderMyBookings(user.id);
    showNotification('رزرو ویرایش شد', 'success');
}

function injectBookingsStyles() {
    if (document.getElementById('bookingStyles')) return;
    const style = document.createElement('style');
    style.id = 'bookingStyles';
    style.textContent = `
        #myBookingsList { display: flex; flex-direction: column; gap: 12px; }
        .booking-item { border: 1px solid #eee; border-radius: 10px; padding: 12px; background: #fff; }
        .booking-main { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .booking-meta { display: flex; align-items: center; gap: 12px; color: #555; font-size: .9rem; }
        .badge { background: #e74c3c; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: .8rem; }
        .booking-meta i { margin-left: 6px; color: #e74c3c; }
        .booking-actions { margin-top: 8px; display: flex; gap: 8px; }
        .btn-sm { padding: 6px 10px; font-size: .85rem; }
        .btn-danger { background: #e74c3c; color: #fff; border: 2px solid #e74c3c; }
        .btn-danger:hover { background: #c0392b; border-color: #c0392b; }
    `;
    document.head.appendChild(style);
}

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