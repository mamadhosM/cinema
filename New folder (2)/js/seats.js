// Seat selection system
class SeatSelectionSystem {
    constructor() {
        this.selectedMovie = null;
        this.selectedCinema = null;
        this.selectedSeats = [];
        this.seatsData = [];
        this.selectedSchedule = null;
        this.editBookingId = null;
        this.init();
    }

    // Initialize the system
    init() {
        this.loadMovieData();
        this.loadCinemas();
        this.setupEventListeners();
        this.updateUserInfo();
        this.updateConfirmButton();
        this.renderScheduleSelectors();
    }

    // Load movie data from localStorage
    loadMovieData() {
        const movieData = localStorage.getItem('selectedMovie');
        const urlParams = new URLSearchParams(window.location.search);
        const bookingIdParam = urlParams.get('bookingId');
        if (bookingIdParam) {
            this.loadFromExistingBooking(parseInt(bookingIdParam));
            return;
        }
        if (movieData) {
            this.selectedMovie = JSON.parse(movieData);
            this.displayMovieInfo();
            console.log('Movie loaded from localStorage:', this.selectedMovie);
        } else {
            // Try to get movie from URL parameters
            const movieId = urlParams.get('movieId');
            
            if (movieId) {
                const allMovies = JSON.parse(localStorage.getItem('movies') || '[]');
                this.selectedMovie = allMovies.find(m => m.id === parseInt(movieId));
                if (this.selectedMovie) {
                    localStorage.setItem('selectedMovie', JSON.stringify(this.selectedMovie));
                    this.displayMovieInfo();
                    console.log('Movie loaded from URL parameters:', this.selectedMovie);
                }
            }
            
            if (!this.selectedMovie) {
                // Redirect to home if no movie selected
                console.log('No movie selected, redirecting to home');
                window.location.href = 'index.html';
            }
        }
    }

    loadFromExistingBooking(bookingId) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const b = bookings.find(x => x.id === bookingId);
        if (!b) { window.location.href = 'profile.html#my-bookings'; return; }
        this.editBookingId = bookingId;
        this.selectedMovie = b.movie;
        this.selectedCinema = b.cinema;
        this.selectedSeats = [...(b.seats || [])];
        if (b.scheduleId) {
            const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
            this.selectedSchedule = schedules.find(s => s.id === b.scheduleId) || { date: new Date(b.date).toISOString().slice(0,10), time: new Date(b.date).toTimeString().slice(0,5) };
        } else {
            this.selectedSchedule = { date: new Date(b.date).toISOString().slice(0,10), time: new Date(b.date).toTimeString().slice(0,5) };
        }
        // Show sections
        document.querySelector('.cinema-selection-section').style.display = 'none';
        document.getElementById('seatSelectionSection').style.display = 'block';
        document.getElementById('bookingSummarySection').style.display = 'block';
        // Fill UI
        this.displayMovieInfo();
        document.getElementById('selectedCinemaName').textContent = this.selectedCinema.name;
        document.getElementById('selectedCinemaAddress').textContent = this.selectedCinema.address;
        document.getElementById('selectedCinemaCapacity').textContent = `ظرفیت: ${this.selectedCinema.capacity} صندلی`;
        this.generateSeatsData();
        // Mark selected seats
        this.seatsData.forEach(s => { if (this.selectedSeats.includes(s.id) && !s.isOccupied) s.isSelected = true; });
        this.renderSeats();
        // Summary
        document.getElementById('summaryDate').textContent = this.formatDate(new Date(this.selectedSchedule.date));
        document.getElementById('summaryTime').textContent = this.selectedSchedule.time;
        this.updateSummary();
        this.updateConfirmButton();
    }

    // Load cinemas from localStorage
    loadCinemas() {
        const cinemas = JSON.parse(localStorage.getItem('cinemas') || '[]');
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        let filtered = cinemas;
        if (this.selectedMovie) {
            const cinemaIds = Array.from(new Set(schedules
                .filter(s => s.movieId === this.selectedMovie.id && s.isActive)
                .map(s => s.cinemaId)));
            filtered = cinemas.filter(c => cinemaIds.includes(c.id));
        }
        this.displayCinemas(filtered);
        // Auto-select cinema from URL if present OR from cinema page
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const cinemaIdParam = urlParams.get('cinemaId');
            if (cinemaIdParam) {
                const cid = parseInt(cinemaIdParam);
                const exists = filtered.find(c => c.id === cid) || cinemas.find(c => c.id === cid);
                if (exists) {
                    this.selectedCinema = exists;
                    // reflect selection and proceed if movie is chosen
                    document.getElementById('selectedCinemaName').textContent = exists.name;
                    document.getElementById('selectedCinemaAddress').textContent = exists.address;
                    document.getElementById('selectedCinemaCapacity').textContent = `ظرفیت: ${exists.capacity} صندلی`;
                }
            }
            const movieIdFromUrl = parseInt(urlParams.get('movieId'));
            if (movieIdFromUrl && !this.selectedMovie) {
                const allMovies = JSON.parse(localStorage.getItem('movies') || '[]');
                const m = allMovies.find(x => x.id === movieIdFromUrl);
                if (m) this.selectedMovie = m;
            }
            if (this.selectedCinema && this.selectedMovie) {
                document.querySelector('.cinema-selection-section').style.display = 'none';
                document.getElementById('seatSelectionSection').style.display = 'block';
                document.getElementById('bookingSummarySection').style.display = 'block';
                this.generateSeatsData();
                this.renderSeats();
                this.updateSummary();
                this.updateConfirmButton();
                // Open showtimes modal so user picks day/time first and occupancy applies
                this.openShowtimes();
            }
        } catch (e) { /* no-op */ }
    }

    // Display movie information
    displayMovieInfo() {
        if (!this.selectedMovie) return;

        document.getElementById('movieImage').textContent = this.selectedMovie.image;
        document.getElementById('movieTitle').textContent = this.selectedMovie.title;
        document.getElementById('movieGenre').textContent = this.selectedMovie.genre;
        document.getElementById('movieDuration').textContent = this.selectedMovie.duration;
        document.getElementById('movieRating').textContent = `${this.selectedMovie.rating}/5`;
        document.getElementById('movieDescription').textContent = this.selectedMovie.description;
        document.getElementById('moviePrice').textContent = `${this.selectedMovie.price} تومان`;
    }

    // Display cinemas
    displayCinemas(cinemas) {
        const cinemasGrid = document.getElementById('cinemasGrid');
        if (!cinemasGrid) return;

        cinemasGrid.innerHTML = '';

        cinemas.forEach(cinema => {
            const cinemaCard = document.createElement('div');
            cinemaCard.className = 'cinema-card';
            cinemaCard.innerHTML = `
                <div class="cinema-header">
                    <h3>${cinema.name}</h3>
                    <span class="cinema-capacity">${cinema.capacity} صندلی</span>
                </div>
                <div class="cinema-details">
                    <p><i class="fas fa-map-marker-alt"></i> ${cinema.address}</p>
                    <p><i class="fas fa-phone"></i> ${cinema.phone}</p>
                    <div class="cinema-features">
                        ${cinema.features.map(feature => `<span>${feature}</span>`).join('')}
                    </div>
                </div>
                <div class="cinema-actions">
                    <button class="btn btn-outline" onclick="viewCinema(${cinema.id})">
                        <i class="fas fa-info-circle"></i>
                        مشخصات سینما
                    </button>
                    <button class="btn btn-primary" onclick="selectCinema(${cinema.id})">
                        <i class="fas fa-check"></i>
                        انتخاب این سینما
                    </button>
                </div>
            `;
            cinemasGrid.appendChild(cinemaCard);
        });
    }

    // Select cinema and show seats
    selectCinema(cinemaId) {
        const cinemas = JSON.parse(localStorage.getItem('cinemas') || '[]');
        this.selectedCinema = cinemas.find(c => c.id === cinemaId);
        
        if (!this.selectedCinema) return;

        console.log(`Cinema ${cinemaId} selected:`, this.selectedCinema);
        
        // Show available movies for this cinema
        this.showAvailableMoviesForCinema(cinemaId);
    }
    
    // Show movie selection modal
    showMovieSelection(movies) {
        const modal = document.createElement('div');
        modal.className = 'modal movie-selection-modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>انتخاب فیلم</h2>
                    <p>فیلم مورد نظر خود را انتخاب کنید</p>
                </div>
                <div class="modal-body">
                    <div class="movies-grid">
                        ${movies.map(movie => `
                            <div class="movie-card" onclick="selectMovieForCinema(${movie.id})">
                                <div class="movie-image">${movie.image}</div>
                                <div class="movie-info">
                                    <h3>${movie.title}</h3>
                                    <p class="movie-genre">${movie.genre}</p>
                                    <p class="movie-duration">${movie.duration}</p>
                                    <p class="movie-rating">⭐ ${movie.rating}/5</p>
                                    <p class="movie-price">${movie.price} تومان</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Select movie and proceed to seat selection
    selectMovieForCinema(movieId) {
        const allMovies = JSON.parse(localStorage.getItem('movies') || '[]');
        this.selectedMovie = allMovies.find(m => m.id === movieId);
        
        // Remove movie selection modal
        const modal = document.querySelector('.movie-selection-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
        
        // Proceed to seat selection
        this.proceedToSeatSelection();
        
        console.log('Movie selected for cinema:', this.selectedMovie);
    }
    
    // Proceed to seat selection after movie selection
    proceedToSeatSelection() {
        document.querySelector('.cinema-selection-section').style.display = 'none';
        document.getElementById('seatSelectionSection').style.display = 'block';
        document.getElementById('bookingSummarySection').style.display = 'block';

        document.getElementById('selectedCinemaName').textContent = this.selectedCinema.name;
        document.getElementById('selectedCinemaAddress').textContent = this.selectedCinema.address;
        document.getElementById('selectedCinemaCapacity').textContent = `ظرفیت: ${this.selectedCinema.capacity} صندلی`;

        this.displayMovieInfo();

        // Reset seats when changing context
        this.selectedSeats = [];
        this.generateSeatsData();
        this.renderSeats();
        this.updateSummary();
        this.updateConfirmButton();

        // Populate weekly dates and times
        this.populateDates();

        console.log('Proceeding to seat selection with:', {
            movie: this.selectedMovie,
            cinema: this.selectedCinema
        });
    }

    // Generate seats data based on cinema capacity
    generateSeatsData() {
        const capacity = this.selectedCinema.capacity;
        // Always 10 columns per row; compute rows based on capacity
        const cols = 10;
        const rows = Math.max(1, Math.ceil(capacity / cols));

        const seats = [];
        const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        const occupied = this.selectedSchedule?.id ? this.getOccupiedSeats(this.selectedSchedule.id) : new Set();

        let created = 0;
        for (let row = 0; row < rows && row < rowLetters.length; row++) {
            for (let col = 1; col <= cols; col++) {
                if (created >= capacity) break;
                const seatNumber = `${rowLetters[row]}${col}`;
                const isVip = (row === 0 || row === 1) && (col >= 2 && col <= cols - 1);
                const isOccupied = occupied.has(seatNumber);
                seats.push({ id: seatNumber, row: rowLetters[row], col, isVip, isOccupied, isSelected: false });
                created++;
            }
        }

        this.seatsData = seats;
    }

    // Render seats grid
    renderSeats() {
        const seatsGrid = document.getElementById('seatsGrid');
        if (!seatsGrid) return;

        seatsGrid.innerHTML = '';

        this.seatsData.forEach(seat => {
            const seatElement = document.createElement('div');
            seatElement.className = `seat-grid-item ${this.getSeatClass(seat)}`;
            seatElement.setAttribute('data-seat', seat.id);
            seatElement.setAttribute('data-seat-id', seat.id);
            
            if (!seat.isOccupied) {
                seatElement.addEventListener('click', () => this.toggleSeat(seat.id));
            }

            seatsGrid.appendChild(seatElement);
        });
        // Inline selection hint
        const info = document.querySelector('.seats-info');
        if (info) {
            const pricePerSeat = this.selectedMovie ? this.parsePrice(this.selectedMovie.price) : 0;
            const totalPrice = this.selectedSeats.length * pricePerSeat;
            info.innerHTML = `<p class="seats-tip">${this.selectedSeats.length > 0 ? `انتخاب شده: ${this.selectedSeats.join(', ')} | مجموع: ${totalPrice.toLocaleString()} تومان` : 'برای انتخاب صندلی روی آن کلیک کنید'}</p>`;
        }
    }

    // Get seat CSS class
    getSeatClass(seat) {
        if (seat.isOccupied) return 'occupied';
        if (seat.isSelected) return 'selected';
        if (seat.isVip) return 'vip';
        return 'available';
    }

    // Toggle seat selection
    toggleSeat(seatId) {
        const seat = this.seatsData.find(s => s.id === seatId);
        if (!seat || seat.isOccupied) return;

        if (seat.isSelected) {
            // Deselect seat
            seat.isSelected = false;
            this.selectedSeats = this.selectedSeats.filter(id => id !== seatId);
        } else {
            // Select seat
            seat.isSelected = true;
            this.selectedSeats.push(seatId);
        }

        // Update seat display
        this.renderSeats();
        
        // Update summary and confirm button
        this.updateSummary();
        this.updateConfirmButton();
        
        console.log('Seat toggled:', {
            seatId,
            isSelected: seat.isSelected,
            totalSelected: this.selectedSeats.length
        });
    }

    // Update booking summary
    updateSummary() {
        if (!this.selectedMovie || !this.selectedCinema) {
            return;
        }
        document.getElementById('summaryMovie').textContent = this.selectedMovie.title;
        document.getElementById('summaryCinema').textContent = this.selectedCinema.name;
        const seatsList = this.selectedSeats.join(', ') || '-';
        document.getElementById('summarySeats').textContent = seatsList;
        document.getElementById('summaryCount').textContent = String(this.selectedSeats.length);

        const pricePerSeat = this.parsePrice(this.selectedMovie.price);
        const totalPrice = this.selectedSeats.length * pricePerSeat;
        document.getElementById('summaryTotal').textContent = `${totalPrice.toLocaleString()} تومان`;
    }

    // Update confirm button state
    updateConfirmButton() {
        const confirmBtn = document.getElementById('confirmBtn');
        if (!confirmBtn) return;
        const hasSeats = this.selectedSeats.length > 0;
        const hasMovie = this.selectedMovie !== null;
        const hasCinema = this.selectedCinema !== null;
        const hasSchedule = this.selectedSchedule && this.selectedSchedule.time && (this.selectedSchedule.date || this.selectedSchedule.id);
        if (hasSeats && hasMovie && hasCinema && hasSchedule) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = `تایید رزرو (${this.selectedSeats.length} صندلی)`;
            confirmBtn.classList.add('btn-primary');
            confirmBtn.classList.remove('btn-disabled');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.textContent = this.selectedSeats.length > 0 ? `تکمیل اطلاعات` : 'انتخاب صندلی';
            confirmBtn.classList.remove('btn-primary');
            confirmBtn.classList.add('btn-disabled');
        }
    }

    // Parse price string to number
    parsePrice(priceString) {
        return parseInt(priceString.replace(/,/g, ''));
    }

    // Format price number
    formatPrice(price) {
        return price.toLocaleString('fa-IR');
    }

    // Format date
    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        return date.toLocaleDateString('fa-IR', options);
    }

    // Update user information in header
    updateUserInfo() {
        const navUser = document.getElementById('navUser');
        if (!navUser) return;

        const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (currentUser) {
            navUser.innerHTML = `
                <span class="user-name">خوش آمدید ${currentUser.firstName} 🌟</span>
                <a href="profile.html" class="btn btn-outline btn-sm">پروفایل</a>
                <a href="profile.html#my-bookings" class="btn btn-outline btn-sm">رزروهای من</a>
                <button class="btn btn-outline btn-sm" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    خروج
                </button>
            `;
        } else {
            navUser.innerHTML = `
                <a href="login.html" class="btn btn-outline btn-sm">ورود</a>
                <a href="register.html" class="btn btn-primary btn-sm">ثبت‌نام</a>
            `;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Add any additional event listeners here
    }

    // Clear all seat selections
    clearSelection() {
        this.selectedSeats = [];
        this.seatsData.forEach(seat => {
            seat.isSelected = false;
        });
        
        this.renderSeats();
        this.updateSummary();
        this.updateConfirmButton();
        
        console.log('All seat selections cleared');
    }

    // Confirm booking
    async confirmBooking() {
        if (this.selectedSeats.length === 0) {
            this.showNotification('❌ لطفاً حداقل یک صندلی انتخاب کنید', 'error');
            return;
        }
        if (!this.selectedSchedule || !this.selectedSchedule.time) {
            this.showNotification('⌛ لطفاً ابتدا سانس را انتخاب کنید', 'warning');
            this.openShowtimes();
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!currentUser) {
            this.showNotification('❌ برای رزرو صندلی ابتدا وارد شوید', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        // Show loading
        this.showLoading(true);

        try {
            // Simulate API call
            await this.delay(800);

            // Generate booking code
            const bookingCode = this.generateBookingCode();

            // Save or update booking in localStorage
            this.saveBooking(bookingCode);

            // Show success modal
            this.showSuccessModal(bookingCode);

        } catch (error) {
            this.showNotification('❌ خطا در رزرو. لطفاً دوباره تلاش کنید', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Generate unique booking code
    generateBookingCode() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `CIN${timestamp.toUpperCase()}${random.toUpperCase()}`;
    }

    // Save booking to localStorage
    saveBooking(bookingCode) {
        const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const urlParams = new URLSearchParams(window.location.search);
        const bookingIdParam = urlParams.get('bookingId');
        if (bookingIdParam) {
            // Update existing booking
            const bookingId = parseInt(bookingIdParam);
            const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const idx = bookings.findIndex(b => b.id === bookingId);
            if (idx !== -1) {
                bookings[idx] = {
                    ...bookings[idx],
                    movie: this.selectedMovie,
                    cinema: this.selectedCinema,
                    seats: this.selectedSeats,
                    user: currentUser,
                    date: this.selectedSchedule?.date ? new Date(`${this.selectedSchedule.date}T${this.selectedSchedule.time || '00:00'}`).toISOString() : new Date().toISOString(),
                    scheduleId: this.selectedSchedule?.id,
                    totalPrice: this.selectedSeats.length * this.parsePrice(this.selectedMovie.price),
                    status: 'confirmed'
                };
                localStorage.setItem('bookings', JSON.stringify(bookings));
                return;
            }
        }
        // Create new booking
        const booking = {
            id: Date.now(),
            code: bookingCode,
            movie: this.selectedMovie,
            cinema: this.selectedCinema,
            seats: this.selectedSeats,
            user: currentUser,
            date: this.selectedSchedule?.date ? new Date(`${this.selectedSchedule.date}T${this.selectedSchedule.time || '00:00'}`).toISOString() : new Date().toISOString(),
            scheduleId: this.selectedSchedule?.id,
            totalPrice: this.selectedSeats.length * this.parsePrice(this.selectedMovie.price),
            status: 'confirmed'
        };
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }

    // Show success modal
    showSuccessModal(bookingCode) {
        document.getElementById('bookingCode').textContent = bookingCode;
        document.getElementById('successModal').classList.add('show');
    }

    // Show loading overlay
    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('show');
            } else {
                loadingOverlay.classList.remove('show');
            }
        }
    }

    // Show notification
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

    // Get notification color
    getNotificationColor(type) {
        const colors = {
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }

    // Utility function for delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Show available movies for selected cinema
    showAvailableMoviesForCinema(cinemaId) {
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        const cinemaSchedules = schedules.filter(s => s.cinemaId === cinemaId && s.isActive);
        
        if (cinemaSchedules.length === 0) {
            this.showNotification('❌ هیچ فیلمی در این سینما در دسترس نیست', 'error');
            return;
        }
        
        // Get movie IDs for this cinema
        const movieIds = cinemaSchedules.map(s => s.movieId);
        
        // Get movies data
        const allMovies = JSON.parse(localStorage.getItem('movies') || '[]');
        const availableMovies = allMovies.filter(movie => movieIds.includes(movie.id));
        
        // If a movie is already selected and available here, auto-select it
        if (this.selectedMovie && availableMovies.some(m => m.id === this.selectedMovie.id)) {
            this.proceedToSeatSelection();
            this.updateConfirmButton();
            return;
        }
        
        // Show movie selection if multiple movies available
        if (availableMovies.length > 1) {
            this.showMovieSelection(availableMovies);
        } else if (availableMovies.length === 1) {
            // Auto-select the only available movie
            this.selectedMovie = availableMovies[0];
            this.proceedToSeatSelection();
        } else {
            // No movies available in this cinema
            this.showNotification('❌ هیچ فیلمی در این سینما در دسترس نیست', 'error');
        }
        
        // Update confirm button state
        this.updateConfirmButton();
    }

    // Render weekly date and time selectors based on schedules and selection
    renderScheduleSelectors() {
        const summarySection = document.getElementById('bookingSummarySection');
        if (!summarySection) return;
        if (document.getElementById('scheduleSelectors')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'scheduleSelectors';
        wrapper.style.display = 'none';
        summarySection.querySelector('.booking-summary-card')?.prepend(wrapper);
    }

    populateDates() {
        // unused with modal, kept for compatibility
    }

    populateTimes() {
        // unused with modal, kept for compatibility
    }

    openShowtimes() {
        if (!this.selectedCinema || !this.selectedMovie) {
            this.showNotification('ابتدا سینما و فیلم را انتخاب کنید', 'warning');
            return;
        }
        // Ensure we have weekly schedules for this cinema/movie
        this.ensureWeeklySchedulesForCinemaMovie(this.selectedCinema.id, this.selectedMovie.id);

        const modal = document.getElementById('showtimesModal');
        const datesBox = document.getElementById('showtimeDates');
        const timesBox = document.getElementById('showtimeTimes');
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        const relevant = schedules.filter(s => s.isActive && s.cinemaId === this.selectedCinema.id && s.movieId === this.selectedMovie.id);
        const uniqueDates = Array.from(new Set(relevant.map(s => s.date))).sort();
        datesBox.innerHTML = uniqueDates.map(d => `<button class="chip" data-date="${d}" onclick="chooseDate('${d}')">${this.formatDate(new Date(d))}</button>`).join('');
        timesBox.innerHTML = '';
        modal.classList.add('show');
    }

    closeShowtimes() {
        document.getElementById('showtimesModal')?.classList.remove('show');
    }

    chooseDate(dateStr) {
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        const relevant = schedules.filter(s => s.isActive && s.cinemaId === this.selectedCinema.id && s.movieId === this.selectedMovie.id && s.date === dateStr);
        const timesBox = document.getElementById('showtimeTimes');
        timesBox.innerHTML = relevant.map(s => `<button class="chip" data-schedule-id="${s.id}" onclick="chooseSchedule(${s.id})">${s.time}</button>`).join('');
        this.selectedSchedule = { ...(this.selectedSchedule || {}), date: dateStr };
        // highlight active date
        document.querySelectorAll('#showtimeDates .chip').forEach(el => el.classList.toggle('active', el.getAttribute('data-date') === dateStr));
        // update summary date preview
        document.getElementById('summaryDate').textContent = this.formatDate(new Date(dateStr));
    }

    chooseSchedule(scheduleId) {
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        const s = schedules.find(x => x.id === scheduleId);
        if (!s) return;
        this.selectedSchedule = s;
        document.getElementById('summaryDate').textContent = this.formatDate(new Date(s.date));
        document.getElementById('summaryTime').textContent = s.time;
        // highlight active time
        document.querySelectorAll('#showtimeTimes .chip').forEach(el => el.classList.toggle('active', parseInt(el.getAttribute('data-schedule-id')) === scheduleId));
        // reset seats and regenerate with occupancy of this schedule
        this.selectedSeats = [];
        this.generateSeatsData();
        this.renderSeats();
        this.updateSummary();
        this.updateConfirmButton();
        this.closeShowtimes();
    }

    // Return a Set of occupied seat IDs for the selected schedule based on bookings
    getOccupiedSeats(scheduleId) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const occupied = new Set();
        bookings.forEach(b => {
            if (b.scheduleId === scheduleId && b.status === 'confirmed') {
                // If editing this booking, skip its current seats so user can modify
                if (this.editBookingId && b.id === this.editBookingId) return;
                (b.seats || []).forEach(seatId => occupied.add(seatId));
            }
        });
        return occupied;
    }

    // Generate weekly schedules for a cinema/movie if missing
    ensureWeeklySchedulesForCinemaMovie(cinemaId, movieId) {
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const times = ['17:00', '19:30', '22:00'];
        // Check if there is at least one schedule in coming 7 days for this cinema/movie
        const hasUpcoming = schedules.some(s => s.cinemaId === cinemaId && s.movieId === movieId && new Date(s.date) >= start && s.isActive);
        if (hasUpcoming) return;
        let maxId = schedules.reduce((mx, s) => Math.max(mx, s.id || 0), 0);
        for (let d = 0; d < 7; d++) {
            const date = new Date(start);
            date.setDate(start.getDate() + d);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${day}`;
            times.forEach(time => {
                maxId += 1;
                schedules.push({ id: maxId, cinemaId, movieId, date: dateStr, time, price: '120,000', isActive: true, createdAt: new Date().toISOString() });
            });
        }
        localStorage.setItem('schedules', JSON.stringify(schedules));
    }
}

// Global functions
function selectCinema(cinemaId) {
    if (window.seatSystem) {
        window.seatSystem.selectCinema(cinemaId);
    }
}
function selectMovieForCinema(movieId) {
    if (window.seatSystem) {
        window.seatSystem.selectMovieForCinema(movieId);
    }
}
function clearSelection() {
    if (window.seatSystem) {
        window.seatSystem.clearSelection();
    }
}
function confirmBooking() {
    if (window.seatSystem) {
        window.seatSystem.confirmBooking();
    }
}
function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}
function logout() {
    if (window.authSystem) {
        window.authSystem.logoutUser();
    } else {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    }
}
function viewCinema(cinemaId) {
    // Navigate to cinema details page
    window.location.href = `cinema.html?cinemaId=${cinemaId}`;
}
function openShowtimes() {
    if (window.seatSystem) window.seatSystem.openShowtimes();
}
function closeShowtimes() {
    if (window.seatSystem) window.seatSystem.closeShowtimes();
}

// Initialize seat selection system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.seatSystem = new SeatSelectionSystem();
});

// Add CSS for notifications and cinema cards
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .notification-content { display: flex; align-items: center; gap: 0.5rem; }
    .user-name { color: var(--text-dark); font-weight: 500; }
    .btn-sm { padding: 8px 16px; font-size: 0.9rem; }
    .cinema-selection-section { padding: 2rem 0; }
    .section-header { text-align: center; margin-bottom: 2rem; }
    .section-header h2 { color: var(--text-dark); margin-bottom: 0.5rem; }
    .section-header p { color: var(--text-light); }
    .cinemas-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .cinema-card { background: var(--bg-white); border-radius: var(--border-radius); padding: 1.5rem; box-shadow: var(--shadow); transition: var(--transition); border: 2px solid transparent; }
    .cinema-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-hover); border-color: var(--primary-color); }
    .cinema-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .cinema-header h3 { color: var(--text-dark); margin: 0; }
    .cinema-capacity { background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .cinema-details p { margin-bottom: 0.5rem; color: var(--text-light); }
    .cinema-details i { color: var(--primary-color); margin-left: 0.5rem; width: 16px; }
    .cinema-features { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
    .cinema-features span { background: rgba(231, 76, 60, 0.1); color: var(--primary-color); padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; }
    .cinema-actions { display: flex; gap: .5rem; justify-content: flex-end; }

    .cinema-info-display { background: var(--bg-white); border-radius: var(--border-radius); padding: 1rem 1.5rem; margin-bottom: 2rem; box-shadow: var(--shadow); text-align: center; }
    .cinema-info-display h3 { color: var(--primary-color); margin-bottom: 0.5rem; }
    .cinema-info-display p { color: var(--text-light); margin-bottom: 0.25rem; }

    .seat-grid-item.vip::after { content: 'VIP'; position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 0.6rem; color: var(--secondary-color); font-weight: 700; }
    .seat-grid-item.vip:hover { box-shadow: 0 8px 25px rgba(243, 156, 18, 0.6); }
    .seat-grid-item.selected { animation: seatSelected 0.3s ease-out; }
    @keyframes seatSelected { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1.1); } }

    .schedule-selectors { background: var(--bg-white); border-radius: var(--border-radius); padding: 1rem; margin-bottom: 1rem; box-shadow: var(--shadow); }
    .schedule-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; }
    .schedule-row label { color: var(--text-dark); min-width: 48px; }
    .schedule-options { display: flex; flex-wrap: wrap; gap: .5rem; }
    .chip { border: 1px solid var(--primary-color); background: white; color: var(--primary-color); padding: .4rem .7rem; border-radius: 16px; cursor: pointer; }
    .chip.active, .chip:hover { background: var(--primary-color); color: white; }

    @media (max-width: 768px) {
        .seats-grid { overflow-x: auto; padding-bottom: 1rem; }
        .seat-grid-item::before { font-size: 0.6rem; }
        .seat-grid-item.vip::after { font-size: 0.5rem; }
        .cinemas-grid { grid-template-columns: 1fr; }
    }
`;
document.head.appendChild(additionalStyles);