// Cinema Manager Panel
(function() {
	function requireManager() {
		const user = JSON.parse(localStorage.getItem('loggedInUser'));
		if (!user || user.role !== 'cinema_manager') {
			window.location.href = 'index.html';
			return null;
		}
		return user;
	}

	function fillUserInfo(user) {
		const el = document.getElementById('userInfo');
		if (el) {
			el.innerHTML = `<i class="fas fa-user-circle"></i><span>خوش آمدید ${user.firstName} ${user.lastName} 🎬</span>`;
		}
		const welcome = document.getElementById('panelWelcome');
		if (welcome) welcome.textContent = 'برنامه‌ها و رزروهای سینمای شما اینجاست';
	}

	function getCinemaById(id) {
		const cinemas = JSON.parse(localStorage.getItem('cinemas') || '[]');
		return cinemas.find(c => c.id === id);
	}

	function getCinemaSchedules(cinemaId) {
		const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
		return schedules.filter(s => s.cinemaId === cinemaId);
	}

	function getCinemaBookings(cinemaId) {
		const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
		return bookings.filter(b => (b.cinema?.id || b.cinemaId) === cinemaId);
	}

	function formatPrice(n) {
		return (n || 0).toLocaleString('fa-IR') + ' تومان';
	}

	function renderDashboard(user) {
		const cinema = getCinemaById(user.cinemaId);
		if (!cinema) return;
		// Header card
		const name = document.getElementById('cinemaName');
		const address = document.getElementById('cinemaAddress');
		const phone = document.getElementById('cinemaPhone');
		const email = document.getElementById('cinemaEmail');
		const capacity = document.getElementById('cinemaCapacity');
		if (name) name.textContent = cinema.name;
		if (address) address.textContent = cinema.address;
		if (phone) phone.textContent = cinema.phone;
		if (email) email.textContent = cinema.email || '-';
		if (capacity) capacity.textContent = String(cinema.capacity || 0);

		// Stats
		const schedules = getCinemaSchedules(cinema.id);
		const todayStr = new Date().toDateString();
		const todaySchedules = schedules.filter(s => new Date(s.date).toDateString() === todayStr);
		const bookings = getCinemaBookings(cinema.id);
		const todayBookings = bookings.filter(b => new Date(b.date).toDateString() === todayStr);
		const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
		const occupancyRate = Math.min(100, Math.round((bookings.length * 2) / (cinema.capacity || 1) * 10));

		const elTodaySchedules = document.getElementById('todaySchedules');
		const elTodayBookings = document.getElementById('todayBookings');
		const elTodayRevenue = document.getElementById('todayRevenue');
		const elOccupancyRate = document.getElementById('occupancyRate');
		if (elTodaySchedules) elTodaySchedules.textContent = String(todaySchedules.length);
		if (elTodayBookings) elTodayBookings.textContent = String(todayBookings.length);
		if (elTodayRevenue) elTodayRevenue.textContent = formatPrice(todayRevenue);
		if (elOccupancyRate) elOccupancyRate.textContent = occupancyRate + '%';
	}

	function renderSchedules(user) {
		const tbody = document.getElementById('schedulesTableBody');
		if (!tbody) return;
		const schedules = getCinemaSchedules(user.cinemaId);
		const movies = JSON.parse(localStorage.getItem('movies') || '[]');
		tbody.innerHTML = '';
		if (schedules.length === 0) {
			tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem">سانسی ثبت نشده است</td></tr>`;
			return;
		}
		schedules.forEach(s => {
			const movie = movies.find(m => m.id === s.movieId);
			const row = document.createElement('tr');
			row.innerHTML = `
				<td>${movie?.title || '-'}</td>
				<td>${s.date}</td>
				<td>${s.time}</td>
				<td>${s.price}</td>
				<td><span class="status-badge ${s.isActive ? 'active' : 'inactive'}">${s.isActive ? 'فعال' : 'غیرفعال'}</span></td>
				<td>
					<div class="table-actions">
						<button class="btn btn-sm btn-outline" onclick="cmToggleSchedule(${s.id})"><i class="fas fa-${s.isActive ? 'ban' : 'check'}"></i></button>
						<button class="btn btn-sm btn-outline" onclick="cmEditSchedule(${s.id})"><i class="fas fa-edit"></i></button>
						<button class="btn btn-sm btn-danger" onclick="cmDeleteSchedule(${s.id})"><i class="fas fa-trash"></i></button>
					</div>
				</td>
			`;
			tbody.appendChild(row);
		});
	}

	function cmToggleSchedule(id) {
		const user = JSON.parse(localStorage.getItem('loggedInUser'));
		if (!user) return;
		const all = JSON.parse(localStorage.getItem('schedules') || '[]');
		const idx = all.findIndex(s => s.id === id && s.cinemaId === user.cinemaId);
		if (idx === -1) return;
		all[idx].isActive = !all[idx].isActive;
		localStorage.setItem('schedules', JSON.stringify(all));
		renderSchedules(user);
	}

	function cmEditSchedule(id) {
		const user = JSON.parse(localStorage.getItem('loggedInUser'));
		if (!user) return;
		const all = JSON.parse(localStorage.getItem('schedules') || '[]');
		const idx = all.findIndex(s => s.id === id && s.cinemaId === user.cinemaId);
		if (idx === -1) return;
		const s = all[idx];
		const date = prompt('تاریخ جدید (YYYY-MM-DD):', s.date) || s.date;
		const time = prompt('ساعت جدید (HH:MM):', s.time) || s.time;
		const price = prompt('قیمت جدید:', s.price) || s.price;
		all[idx] = { ...s, date, time, price };
		localStorage.setItem('schedules', JSON.stringify(all));
		renderSchedules(user);
	}

	function cmDeleteSchedule(id) {
		if (!confirm('حذف این سانس؟')) return;
		const user = JSON.parse(localStorage.getItem('loggedInUser'));
		if (!user) return;
		const all = JSON.parse(localStorage.getItem('schedules') || '[]');
		const next = all.filter(s => !(s.id === id && s.cinemaId === user.cinemaId));
		localStorage.setItem('schedules', JSON.stringify(next));
		renderSchedules(user);
	}

	function attachGlobalFns() {
		window.cmToggleSchedule = cmToggleSchedule;
		window.cmEditSchedule = cmEditSchedule;
		window.cmDeleteSchedule = cmDeleteSchedule;
		window.logout = function() { localStorage.removeItem('loggedInUser'); window.location.href = 'index.html'; };
		window.addSchedule = function() {
			const user = JSON.parse(localStorage.getItem('loggedInUser'));
			if (!user) return;
			const movieId = parseInt(document.getElementById('scheduleMovie')?.value || '');
			const date = document.getElementById('scheduleDate')?.value || '';
			const time = document.getElementById('scheduleTime')?.value || '';
			const price = document.getElementById('schedulePrice')?.value || '';
			if (!movieId || !date || !time || !price) { alert('همه فیلدها الزامی است'); return; }
			const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
			const id = (schedules.reduce((mx, s) => Math.max(mx, s.id || 0), 0) + 1) || 1;
			schedules.push({ id, movieId, cinemaId: user.cinemaId, date, time, price, isActive: true, createdAt: new Date().toISOString() });
			localStorage.setItem('schedules', JSON.stringify(schedules));
			closeModal && closeModal('addScheduleModal');
			renderSchedules(user);
			alert('سانس اضافه شد');
		};
	}

	function fillSettings(user) {
		const name = document.getElementById('cinemaNameInput');
		const address = document.getElementById('cinemaAddressInput');
		const phone = document.getElementById('cinemaPhoneInput');
		const email = document.getElementById('cinemaEmailInput');
		const capacity = document.getElementById('cinemaCapacityInput');
		const cinema = getCinemaById(user.cinemaId);
		if (!cinema) return;
		if (name) name.value = cinema.name;
		if (address) address.value = cinema.address;
		if (phone) phone.value = cinema.phone;
		if (email) email.value = cinema.email || '';
		if (capacity) capacity.value = cinema.capacity || 0;
	}

	function wiringSettingsSave(user) {
		const btn = document.querySelector('#settings button.btn.btn-primary');
		if (!btn) return;
		btn.addEventListener('click', function(){
			const cinema = getCinemaById(user.cinemaId);
			if (!cinema) return;
			const cinemas = JSON.parse(localStorage.getItem('cinemas') || '[]');
			const idx = cinemas.findIndex(c => c.id === user.cinemaId);
			if (idx === -1) return;
			cinemas[idx] = {
				...cinema,
				name: document.getElementById('cinemaNameInput')?.value || cinema.name,
				address: document.getElementById('cinemaAddressInput')?.value || cinema.address,
				phone: document.getElementById('cinemaPhoneInput')?.value || cinema.phone,
				email: document.getElementById('cinemaEmailInput')?.value || cinema.email,
				capacity: parseInt(document.getElementById('cinemaCapacityInput')?.value || cinema.capacity)
			};
			localStorage.setItem('cinemas', JSON.stringify(cinemas));
			alert('تنظیمات سینما ذخیره شد');
		});
	}

	function setupNav() {
		const navItems = document.querySelectorAll('.nav-item');
		navItems.forEach(item => {
			item.addEventListener('click', e => {
				e.preventDefault();
				const sectionId = item.getAttribute('data-section');
				document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
				document.getElementById(sectionId)?.classList.add('active');
				navItems.forEach(i => i.classList.remove('active'));
				item.classList.add('active');
			});
		});
	}

	document.addEventListener('DOMContentLoaded', function() {
		const user = requireManager();
		if (!user) return;
		fillUserInfo(user);
		renderDashboard(user);
		renderSchedules(user);
		fillSettings(user);
		wiringSettingsSave(user);
		setupNav();
		attachGlobalFns();
	});
})();