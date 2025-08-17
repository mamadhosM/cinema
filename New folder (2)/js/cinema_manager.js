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
			el.innerHTML = `<i class="fas fa-user-circle"></i><span>${user.firstName} ${user.lastName}</span>`;
		}
	}

	function getCinemaById(id) {
		const cinemas = JSON.parse(localStorage.getItem('cinemas') || '[]');
		return cinemas.find(c => c.id === id);
	}

	function getCinemaSchedules(cinemaId) {
		const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
		return schedules.filter(s => s.cinemaId === cinemaId && s.isActive);
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
		setupNav();
	});
})();