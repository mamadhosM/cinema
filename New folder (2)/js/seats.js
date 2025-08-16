// Seat selection and booking system
class SeatSelectionSystem {
    constructor() {
        this.selectedMovie = null;
        this.selectedCinema = null;
        this.selectedSchedule = null;
        this.selectedSeats = [];
        this.seatsData = [];
        this.init();
    }

    // Initialize the system
    init() {
        this.loadSelectedMovie();
        this.loadCinemas();
        this.setupEventListeners();
        this.checkUserAuth();
    }

    // Check user authentication
    checkUserAuth() {
        const user = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user) {
            showNotification('❌ برای رزرو صندلی ابتدا وارد شوید', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
    }

    // Load selected movie from localStorage
    loadSelectedMovie() {
        const selectedMovie = localStorage.getItem('selectedMovie');
        if (!selectedMovie) {
            showNotification('❌ فیلمی انتخاب نشده است', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        this.selectedMovie = JSON.parse(selectedMovie);
        this.displayMovieInfo();
    }

    // Load cinemas from localStorage
    loadCinemas() {
        const cinemas = JSON.parse(localStorage.getItem('cinemas') || '[]');
        this.displayCinemas(cinemas);
    }

    // Display movie information
    displayMovieInfo() {
        const movieInfo = document.getElementById('movieInfo');
        if (movieInfo && this.selectedMovie) {
            movieInfo.innerHTML = `
                <div class="movie-image">${this.selectedMovie.image}</div>
                <div class="movie-details">
                    <h3>${this.selectedMovie.title}</h3>
                    <p class="genre">${this.selectedMovie.genre}</p>
                    <p class="duration">${this.selectedMovie.duration}</p>
                    <p class="rating">⭐ ${this.selectedMovie.rating}/5</p>
                </div>
            `;
        }
    }

    // Display available cinemas
    displayCinemas(cinemas) {
        const cinemasGrid = document.getElementById('cinemasGrid');
        if (!cinemasGrid) return;

        cinemasGrid.innerHTML = cinemas.map(cinema => `
            <div class="cinema-card" onclick="selectCinema(${cinema.id})">
                <div class="cinema-header">
                    <h3>${cinema.name}</h3>
                    <span class="cinema-rating">⭐ 4.5</span>
                </div>
                <div class="cinema-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${cinema.address}</p>
                    <p><i class="fas fa-phone"></i> ${cinema.phone}</p>
                    <p><i class="fas fa-users"></i> ظرفیت: ${cinema.capacity} صندلی</p>
                </div>
                <div class="cinema-features">
                    ${cinema.features.map(feature => `<span class="feature">${feature}</span>`).join('')}
                </div>
                <button class="select-cinema-btn">
                    انتخاب این سینما
                </button>
            </div>
        `).join('');
    }

    // Select cinema and show schedules
    selectCinema(cinemaId) {
        const cinemas = JSON.parse(localStorage.getItem('cinemas') || '[]');
        this.selectedCinema = cinemas.find(c => c.id === cinemaId);
        
        if (!this.selectedCinema) return;

        console.log(`Cinema ${cinemaId} selected:`, this.selectedCinema);
        
        // Show schedules for this cinema and movie
        this.showSchedulesForCinema(cinemaId);
    }

    // Show schedules for selected cinema and movie
    showSchedulesForCinema(cinemaId) {
        const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
        const movieId = this.selectedMovie.id;
        
        // Filter schedules for this cinema and movie
        const availableSchedules = schedules.filter(schedule => 
            schedule.cinemaId == cinemaId && 
            schedule.movieId == movieId && 
            schedule.isActive
        );
        
        if (availableSchedules.length === 0) {
            // No schedules available
            this.showNoSchedulesMessage();
            return;
        }
        
        // Display schedules
        this.displaySchedules(availableSchedules);
        
        // Show schedule selection section
        document.getElementById('scheduleSelectionSection').style.display = 'block';
    }

    // Show message when no schedules are available
    showNoSchedulesMessage() {
        const cinemasGrid = document.getElementById('cinemasGrid');
        const message = document.createElement('div');
        message.className = 'no-schedules-message';
        message.innerHTML = `
            <div class="message-content">
                <i class="fas fa-calendar-times"></i>
                <h3>سانسی برای این فیلم در این سینما موجود نیست</h3>
                <p>لطفاً سینمای دیگری انتخاب کنید</p>
            </div>
        `;
        
        cinemasGrid.appendChild(message);
    }

    // Display available schedules
    displaySchedules(schedules) {
        const scheduleGrid = document.getElementById('scheduleGrid');
        if (!scheduleGrid) return;
        
        scheduleGrid.innerHTML = '';
        
        // Group schedules by date
        const schedulesByDate = this.groupSchedulesByDate(schedules);
        
        Object.keys(schedulesByDate).forEach(date => {
            const dateSchedules = schedulesByDate[date];
            const dateCard = document.createElement('div');
            dateCard.className = 'date-card';
            
            const persianDate = this.convertToPersianDate(date);
            
            dateCard.innerHTML = `
                <div class="date-header">
                    <h3>${persianDate}</h3>
                </div>
                <div class="time-slots">
                    ${dateSchedules.map(schedule => `
                        <button class="time-slot" onclick="selectSchedule(${schedule.id})">
                            <span class="time">${schedule.time}</span>
                            <span class="price">${schedule.price || this.selectedMovie.price} تومان</span>
                        </button>
                    `).join('')}
                </div>
            `;
            
            scheduleGrid.appendChild(dateCard);
        });
    }

    // Group schedules by date
    groupSchedulesByDate(schedules) {
        const grouped = {};
        schedules.forEach(schedule => {
            const date = schedule.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(schedule);
        });
        return grouped;
    }

    // Convert date to Persian format
    convertToPersianDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('fa-IR', options);
    }

    // Select schedule and proceed to seat selection
    selectSchedule(scheduleId) {
        const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
        this.selectedSchedule = schedules.find(s => s.id === scheduleId);
        
        if (!this.selectedSchedule) return;
        
        console.log('Schedule selected:', this.selectedSchedule);
        
        // Hide schedule selection, show seat selection
        document.getElementById('scheduleSelectionSection').style.display = 'none';
        
        // Proceed to seat selection
        this.proceedToSeatSelection();
    }

    // Proceed to seat selection
    proceedToSeatSelection() {
        // Hide schedule selection, show seat selection
        document.getElementById('scheduleSelectionSection').style.display = 'none';
        document.getElementById('seatSelectionSection').style.display = 'block';
        document.getElementById('bookingSummarySection').style.display = 'block';

        // Update cinema info display
        document.getElementById('selectedCinemaName').textContent = this.selectedCinema.name;
        document.getElementById('selectedCinemaAddress').textContent = this.selectedCinema.address;
        document.getElementById('selectedCinemaCapacity').textContent = `ظرفیت: ${this.selectedCinema.capacity} صندلی`;

        // Update movie info display
        this.displayMovieInfo();

        // Generate seats for this cinema
        this.generateSeatsData();
        this.renderSeats();
        this.updateSummary();
        this.updateConfirmButton();
        
        console.log('Proceeding to seat selection with:', {
            movie: this.selectedMovie,
            cinema: this.selectedCinema,
            schedule: this.selectedSchedule
        });
    }

    // Generate seats data with proper layout
    generateSeatsData() {
        this.seatsData = [];
        const capacity = this.selectedCinema.capacity;
        
        // Calculate optimal layout
        const seatsPerRow = 12; // Standard cinema row
        const totalRows = Math.ceil(capacity / seatsPerRow);
        
        let seatNumber = 1;
        
        for (let row = 1; row <= totalRows; row++) {
            for (let col = 1; col <= seatsPerRow; col++) {
                if (seatNumber <= capacity) {
                    // Create seat with proper positioning
                    this.seatsData.push({
                        id: seatNumber,
                        row: row,
                        col: col,
                        isAvailable: true,
                        isSelected: false,
                        seatLabel: this.generateSeatLabel(row, col)
                    });
                    seatNumber++;
                }
            }
        }
        
        console.log(`Generated ${this.seatsData.length} seats for cinema with capacity ${capacity}`);
    }

    // Generate seat label (A1, A2, B1, B2, etc.)
    generateSeatLabel(row, col) {
        const rowLetter = String.fromCharCode(64 + row); // A, B, C, etc.
        return `${rowLetter}${col}`;
    }

    // Render seats with professional layout
    renderSeats() {
        const seatsContainer = document.getElementById('seatsContainer');
        if (!seatsContainer) return;

        seatsContainer.innerHTML = '';
        
        // Group seats by row
        const seatsByRow = {};
        this.seatsData.forEach(seat => {
            if (!seatsByRow[seat.row]) {
                seatsByRow[seat.row] = [];
            }
            seatsByRow[seat.row].push(seat);
        });

        // Create row elements with proper spacing
        Object.keys(seatsByRow).forEach(rowNum => {
            const rowElement = document.createElement('div');
            rowElement.className = 'seat-row';
            
            // Add row label
            const rowLabel = document.createElement('span');
            rowLabel.className = 'row-label';
            rowLabel.textContent = `ردیف ${String.fromCharCode(64 + parseInt(rowNum))}`;
            rowElement.appendChild(rowLabel);
            
            // Add seats for this row
            seatsByRow[rowNum].forEach(seat => {
                const seatElement = document.createElement('div');
                seatElement.className = `seat available`;
                seatElement.dataset.seatId = seat.id;
                seatElement.dataset.seatLabel = seat.seatLabel;
                seatElement.textContent = seat.seatLabel;
                
                if (seat.isAvailable) {
                    seatElement.addEventListener('click', () => this.toggleSeat(seat.id));
                }
                
                rowElement.appendChild(seatElement);
            });
            
            seatsContainer.appendChild(rowElement);
        });
        
        console.log('Seats rendered successfully');
    }

    // Toggle seat selection
    toggleSeat(seatId) {
        const seat = this.seatsData.find(s => s.id === seatId);
        if (!seat || !seat.isAvailable) return;

        seat.isSelected = !seat.isSelected;
        
        if (seat.isSelected) {
            this.selectedSeats.push(seatId);
        } else {
            this.selectedSeats = this.selectedSeats.filter(id => id !== seatId);
        }

        // Update seat display
        this.updateSeatDisplay(seatId);
        this.updateSummary();
        this.updateConfirmButton();
        
        console.log(`Seat ${seat.seatLabel} ${seat.isSelected ? 'selected' : 'deselected'}`);
    }

    // Update seat display
    updateSeatDisplay(seatId) {
        const seatElement = document.querySelector(`[data-seat-id="${seatId}"]`);
        if (!seatElement) return;

        const seat = this.seatsData.find(s => s.id === seatId);
        
        // Remove all classes and add appropriate one
        seatElement.classList.remove('available', 'selected', 'occupied');
        
        if (seat.isSelected) {
            seatElement.classList.add('selected');
        } else {
            seatElement.classList.add('available');
        }
    }

    // Update booking summary
    updateSummary() {
        if (!this.selectedMovie || !this.selectedCinema || !this.selectedSchedule) {
            console.log('Cannot update summary: movie, cinema, or schedule not selected');
            return;
        }

        document.getElementById('summaryMovie').textContent = this.selectedMovie.title;
        document.getElementById('summaryCinema').textContent = this.selectedCinema.name;
        document.getElementById('summaryDate').textContent = this.convertToPersianDate(this.selectedSchedule.date);
        document.getElementById('summaryTime').textContent = this.selectedSchedule.time;
        
        // Show selected seat labels
        const selectedSeatLabels = this.selectedSeats.map(seatId => {
            const seat = this.seatsData.find(s => s.id === seatId);
            return seat ? seat.seatLabel : seatId;
        });
        document.getElementById('summarySeats').textContent = selectedSeatLabels.join(', ') || '-';
        document.getElementById('summaryCount').textContent = this.selectedSeats.length;
        
        // Calculate total price
        const pricePerSeat = this.parsePrice(this.selectedSchedule.price || this.selectedMovie.price);
        const totalPrice = this.selectedSeats.length * pricePerSeat;
        document.getElementById('summaryTotal').textContent = `${totalPrice.toLocaleString()} تومان`;
        
        console.log('Summary updated:', {
            movie: this.selectedMovie.title,
            cinema: this.selectedCinema.name,
            schedule: this.selectedSchedule,
            seats: selectedSeatLabels,
            totalPrice: totalPrice
        });
    }

    // Update confirm button
    updateConfirmButton() {
        const confirmBtn = document.getElementById('confirmBtn');
        if (!confirmBtn) return;
        
        const hasSeats = this.selectedSeats.length > 0;
        const hasMovie = this.selectedMovie !== null;
        const hasCinema = this.selectedCinema !== null;
        const hasSchedule = this.selectedSchedule !== null;
        
        if (hasSeats && hasMovie && hasCinema && hasSchedule) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = `تایید رزرو (${this.selectedSeats.length} صندلی)`;
            confirmBtn.classList.add('btn-primary');
            confirmBtn.classList.remove('btn-disabled');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'انتخاب صندلی';
            confirmBtn.classList.remove('btn-primary');
            confirmBtn.classList.add('btn-disabled');
        }
        
        console.log('Confirm button updated:', {
            hasSeats,
            hasMovie,
            hasCinema,
            hasSchedule,
            selectedSeats: this.selectedSeats.length
        });
    }

    // Parse price string to number
    parsePrice(priceString) {
        if (typeof priceString === 'number') return priceString;
        return parseInt(priceString.replace(/[^\d]/g, '')) || 0;
    }

    // Save booking to localStorage
    saveBooking(bookingCode) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
        const booking = {
            id: Date.now(),
            code: bookingCode,
            movie: this.selectedMovie,
            cinema: this.selectedCinema,
            schedule: this.selectedSchedule,
            seats: this.selectedSeats.map(seatId => {
                const seat = this.seatsData.find(s => s.id === seatId);
                return seat ? seat.seatLabel : seatId;
            }),
            user: currentUser,
            date: new Date().toISOString(),
            totalPrice: this.selectedSeats.length * this.parsePrice(this.selectedSchedule.price || this.selectedMovie.price),
            status: 'confirmed'
        };

        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        console.log('Booking saved:', booking);
    }

    // Generate booking code
    generateBookingCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Confirm booking
    async confirmBooking() {
        if (this.selectedSeats.length === 0) {
            this.showNotification('❌ لطفاً حداقل یک صندلی انتخاب کنید', 'error');
            return;
        }

        if (!this.selectedSchedule) {
            this.showNotification('❌ لطفاً سانس مورد نظر را انتخاب کنید', 'error');
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
        if (!currentUser) {
            this.showNotification('❌ برای رزرو صندلی ابتدا وارد شوید', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        try {
            // Generate booking code
            const bookingCode = this.generateBookingCode();
            
            // Save booking
            this.saveBooking(bookingCode);
            
            // Show success message
            this.showNotification('✅ رزرو با موفقیت انجام شد!', 'success');
            
            // Show booking confirmation
            this.showBookingConfirmation(bookingCode);
            
        } catch (error) {
            this.showNotification('❌ خطا در رزرو صندلی', 'error');
        }
    }

    // Show booking confirmation
    showBookingConfirmation(bookingCode) {
        const confirmationSection = document.getElementById('bookingConfirmationSection');
        if (!confirmationSection) return;

        // Update confirmation details
        document.getElementById('confirmationCode').textContent = bookingCode;
        document.getElementById('confirmationMovie').textContent = this.selectedMovie.title;
        document.getElementById('confirmationCinema').textContent = this.selectedCinema.name;
        document.getElementById('confirmationDate').textContent = this.convertToPersianDate(this.selectedSchedule.date);
        document.getElementById('confirmationTime').textContent = this.selectedSchedule.time;
        
        // Show selected seat labels
        const selectedSeatLabels = this.selectedSeats.map(seatId => {
            const seat = this.seatsData.find(s => s.id === seatId);
            return seat ? seat.seatLabel : seatId;
        });
        document.getElementById('confirmationSeats').textContent = selectedSeatLabels.join(', ');
        
        document.getElementById('confirmationTotal').textContent = `${(this.selectedSeats.length * this.parsePrice(this.selectedSchedule.price || this.selectedMovie.price)).toLocaleString()} تومان`;

        // Show confirmation section
        document.getElementById('seatSelectionSection').style.display = 'none';
        document.getElementById('bookingSummarySection').style.display = 'none';
        confirmationSection.style.display = 'block';
    }

    // Reset to cinema selection
    resetToCinemaSelection() {
        this.selectedSchedule = null;
        this.selectedSeats = [];
        this.seatsData = [];
        
        // Hide all sections, show cinema selection
        document.getElementById('scheduleSelectionSection').style.display = 'none';
        document.getElementById('seatSelectionSection').style.display = 'none';
        document.getElementById('bookingSummarySection').style.display = 'none';
        document.querySelector('.cinema-selection-section').style.display = 'block';
        
        console.log('Reset to cinema selection');
    }

    // Clear seat selection
    clearSelection() {
        this.selectedSeats = [];
        this.seatsData.forEach(seat => {
            seat.isSelected = false;
        });
        
        this.renderSeats();
        this.updateSummary();
        this.updateConfirmButton();
        
        this.showNotification('انتخاب صندلی‌ها پاک شد', 'info');
    }

    // Setup event listeners
    setupEventListeners() {
        // Confirm booking button
        const confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmBooking());
        }

        // Clear selection button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSelection());
        }

        // Back to home button
        const backHomeBtn = document.getElementById('backHomeBtn');
        if (backHomeBtn) {
            backHomeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
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

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
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
}

// Global functions for HTML onclick events
function selectCinema(cinemaId) {
    if (window.seatSystem) {
        window.seatSystem.selectCinema(cinemaId);
    }
}

function selectSchedule(scheduleId) {
    if (window.seatSystem) {
        window.seatSystem.selectSchedule(scheduleId);
    }
}

function resetToCinemaSelection() {
    if (window.seatSystem) {
        window.seatSystem.resetToCinemaSelection();
    }
}

function clearSelection() {
    if (window.seatSystem) {
        window.seatSystem.clearSelection();
    }
}

// Initialize seat selection system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.seatSystem = new SeatSelectionSystem();
});