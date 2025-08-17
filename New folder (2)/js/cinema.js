(function(){
	function qs(name){ return document.getElementById(name); }
	function getParam(key){ try { return new URLSearchParams(window.location.search).get(key); } catch(e){ return null; } }
	function updateNavAuth(){
		const nav = document.getElementById('navAuth');
		if (!nav) return;
		const user = JSON.parse(localStorage.getItem('loggedInUser'));
		if (!user) {
			nav.innerHTML = `<a href="login.html" class="btn btn-outline">ورود</a><a href="register.html" class="btn btn-primary">ثبت‌نام</a>`;
			return;
		}
		const roleLinks = [];
		if (user.role === 'admin') roleLinks.push(`<a href="admin.html" class="btn btn-outline">پنل مدیریت</a>`);
		if (user.role === 'cinema_manager') roleLinks.push(`<a href="cinema_manager.html" class="btn btn-outline">پنل مدیر سینما</a>`);
		nav.innerHTML = `${roleLinks.join('')}<a href="profile.html" class="btn btn-outline">پروفایل</a><a href="profile.html#my-bookings" class="btn btn-outline">رزروهای من</a><button class="btn btn-primary" id="logoutBtn">خروج</button>`;
		document.getElementById('logoutBtn')?.addEventListener('click', ()=>{ localStorage.removeItem('loggedInUser'); window.location.href='index.html'; });
	}
	function formatDateFa(d){ return new Date(d).toLocaleDateString('fa-IR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }); }

	document.addEventListener('DOMContentLoaded', function(){
		updateNavAuth();
		const cinemaId = parseInt(getParam('cinemaId'));
		const cinemas = JSON.parse(localStorage.getItem('cinemas') || '[]');
		const movies = JSON.parse(localStorage.getItem('movies') || '[]');
		const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
		const cinema = cinemas.find(c => c.id === cinemaId) || cinemas[0];
		if (!cinema) { window.location.href = 'index.html#cinemas'; return; }
		qs('cinemaName').textContent = cinema.name;
		qs('cinemaAddress').textContent = `📍 ${cinema.address}`;
		qs('cinemaPhone').textContent = `📞 ${cinema.phone}`;
		qs('cinemaEmail').textContent = `✉️ ${cinema.email || '-'}`;
		qs('cinemaCapacity').textContent = `👥 ظرفیت: ${cinema.capacity} صندلی`;

		const cinemaSchedules = schedules.filter(s => s.cinemaId === cinema.id && s.isActive);
		const movieIds = Array.from(new Set(cinemaSchedules.map(s => s.movieId)));
		const availableMovies = movies.filter(m => m.isActive && movieIds.includes(m.id));
		const container = qs('moviesList');
		if (!availableMovies.length) { container.innerHTML = `<p>فیلمی در این سینما موجود نیست.</p>`; return; }
		container.innerHTML = availableMovies.map(m => `
			<div class="movie-card">
				<div class="movie-image">${m.image || '🎬'}</div>
				<div class="movie-info">
					<h3>${m.title}</h3>
					<p class="movie-genre">${m.genre}</p>
					<p class="movie-duration">${m.duration}</p>
					<div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap">
						<a class="btn btn-outline" href="seats.html?cinemaId=${cinema.id}&movieId=${m.id}">مشاهده سانس‌ها</a>
						<a class="btn btn-primary" href="seats.html?cinemaId=${cinema.id}&movieId=${m.id}">رزرو</a>
					</div>
				</div>
			</div>
		`).join('');

		injectStyles();
	});

	function injectStyles(){
		if (document.getElementById('cinemaPageStyles')) return;
		const st = document.createElement('style');
		st.id = 'cinemaPageStyles';
		st.textContent = `.movie-date-row{display:flex;gap:.5rem;align-items:center;margin:.25rem 0}.movie-date-row .date{min-width:140px;color:#555}.movie-date-row .times{display:flex;gap:.4rem;flex-wrap:wrap}.chip{border:1px solid var(--primary-color);color:var(--primary-color);background:#fff;padding:.25rem .5rem;border-radius:14px}.chip:hover{background:var(--primary-color);color:#fff}.cinema-info-display{max-width:900px;margin:0 auto 1rem;box-shadow:var(--shadow)} .cinema-info-display p{display:flex;align-items:center;gap:.5rem;justify-content:center}`;
		document.head.appendChild(st);
	}
})();