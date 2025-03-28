// Make initMap function global for Google Maps callback
window.initMap = function() {
    try {
        console.log("Initializing map...");
        
        // Check if the map element exists
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Map element not found');
            showMapError('Map element not found. Please refresh the page.');
            return;
        }
        
        // Check if Google Maps API is loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error('Google Maps API not loaded');
            showMapError('Google Maps API is not available. Please check your internet connection and try again.');
            return;
        }
        
        // Default location (Guyana - West Bank Demerara area)
        const defaultLocation = { lat: 6.8057, lng: -58.1553 };
        
        // Create a new map centered at the default location
        window.map = new google.maps.Map(mapElement, {
            center: defaultLocation,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true
        });
        
        // Hide the fallback placeholder
        const fallback = document.getElementById('map-fallback');
        if (fallback) {
            fallback.style.display = 'none';
        }
        
        // Initialize geocoder for address lookups
        window.geocoder = new google.maps.Geocoder();
        
        // Initialize directions service for route planning
        window.directionsService = new google.maps.DirectionsService();
        window.directionsRenderer = new google.maps.DirectionsRenderer({
            map: window.map,
            suppressMarkers: true
        });
        
        // Add a click event listener to the map
        window.map.addListener('click', function(event) {
            placeMarker(event.latLng);
        });
        
        // Create autocomplete for the pickup input
        if (google.maps.places) {
            const pickupAutocomplete = new google.maps.places.Autocomplete(
                document.getElementById('pickup'),
                { types: ['geocode'] }
            );
            
            // Prevent form submission on enter in autocomplete
            // Using standard addEventListener instead of deprecated addDomListener
            document.getElementById('pickup').addEventListener('keydown', function(e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                }
            });
            
            pickupAutocomplete.addListener('place_changed', function() {
                const place = pickupAutocomplete.getPlace();
                if (!place.geometry) {
                    return;
                }
                
                // If the place has a geometry, then present it on a map
                window.map.setCenter(place.geometry.location);
                window.map.setZoom(17);
                
                // Place a marker and update the pickup input
                placeMarker(place.geometry.location, 'pickup');
            });
            
            // Create autocomplete for the destination input
            const destinationAutocomplete = new google.maps.places.Autocomplete(
                document.getElementById('destination'),
                { types: ['geocode'] }
            );
            
            // Prevent form submission on enter in autocomplete
            // Using standard addEventListener instead of deprecated addDomListener
            document.getElementById('destination').addEventListener('keydown', function(e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                }
            });
            
            destinationAutocomplete.addListener('place_changed', function() {
                const place = destinationAutocomplete.getPlace();
                if (!place.geometry) {
                    return;
                }
                
                // If the place has a geometry, then present it on a map
                window.map.setCenter(place.geometry.location);
                window.map.setZoom(17);
                
                // Place a marker and update the destination input
                placeMarker(place.geometry.location, 'destination');
                
                // If both markers are placed, calculate and display the route
                calculateAndDisplayRoute();
            });
        } else {
            console.warn('Google Maps Places API not loaded');
            showMapError('The Places service is not available. Some features may not work correctly.');
        }
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        // Show error on the map
        showMapError('An error occurred while initializing the map. Please refresh the page.');
    }
};

// Global variables
window.markers = [];
window.selectedMode = 'pickup'; // 'pickup' or 'destination'
window.isScheduled = false; // Flag for scheduled rides
window.isLoggedIn = false; // User login state
window.userData = null; // User data storage

// Function to show map error
function showMapError(message) {
    const mapElement = document.getElementById('map');
    const fallback = document.getElementById('map-fallback');
    
    if (fallback) {
        fallback.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #d32f2f;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Map Error</h3>
                <p>${message}</p>
            </div>
        `;
        fallback.style.display = 'flex';
    } else if (mapElement) {
        mapElement.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #d32f2f;">
                <h3>Map Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Function to check if device is mobile
function isMobileDevice() {
    // Check if the device is mobile based on screen size or user agent
    const isMobileBySize = window.innerWidth <= 768;
    const isMobileByAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return isMobileBySize || isMobileByAgent;
}

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded, setting up event listeners");
    
    // Get DOM elements
    setupDOMElements();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI based on current state
    initializeUI();

    // Initialize animation on scroll
    setupAnimations();
    
    // Check if we should open login modal from URL parameter
    checkLoginParam();
    
    // Setup device-specific elements (hide/show location button)
    setupDeviceSpecificElements();
    
    // Setup resize listener for device detection
    window.addEventListener('resize', setupDeviceSpecificElements);
});

// Function to check URL for login parameter and open modal if needed
function checkLoginParam() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'true') {
        // Open login modal
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            openModal(loginModal);
            
            // Remove the parameter from URL without refreshing
            const newUrl = window.location.pathname + window.location.hash;
            history.replaceState(null, '', newUrl);
        }
    }
}

// Function to set up all DOM element references
function setupDOMElements() {
    // Main UI Elements
    window.elements = {
        // Form elements
        rideForm: document.getElementById('ride-form'),
        pickupInput: document.getElementById('pickup'),
        destinationInput: document.getElementById('destination'),
        nameInput: document.getElementById('name'),
        phoneInput: document.getElementById('phone'),
        carTypeSelect: document.getElementById('car-type'),
        notesInput: document.getElementById('notes'),
        rideDateInput: document.getElementById('ride-date'),
        rideTimeInput: document.getElementById('ride-time'),
        scheduleOptions: document.getElementById('schedule-options'),
        rideSubmitBtn: document.getElementById('ride-submit-btn'),
        
        // Booking tabs
        bookingTabs: document.querySelectorAll('.booking-tab'),
        
        // Map controls
        currentLocationBtn: document.getElementById('current-location'),
        pickupBtn: document.getElementById('pickup-btn'),
        destinationBtn: document.getElementById('destination-btn'),
        
        // Account elements
        loginBtn: document.getElementById('login-btn'),
        accountLink: document.getElementById('account-link'),
        accountButtons: document.querySelector('.account-buttons'),
        
        // Account modals
        loginModal: document.getElementById('login-modal'),
        accountModal: document.getElementById('account-modal'),
        
        // Account forms
        loginForm: document.getElementById('login-form'),
        editProfileForm: document.getElementById('edit-profile-form'),
        
        // Dashboard elements
        dashboardTabs: document.querySelectorAll('.dashboard-tab'),
        dashboardPanels: document.querySelectorAll('.dashboard-panel'),
        profilePanel: document.getElementById('profile-panel'),
        ridesPanel: document.getElementById('rides-panel'),
        scheduledPanel: document.getElementById('scheduled-panel'),
        
        // Profile elements
        profileName: document.getElementById('profile-name'),
        profileEmail: document.getElementById('profile-email'),
        profilePhone: document.getElementById('profile-phone'),
        editProfileBtn: document.querySelector('.edit-profile-btn'),
        cancelEditBtn: document.querySelector('.cancel-edit'),
        logoutBtn: document.querySelector('.logout-btn'),
        
        // Dashboard ride lists
        pastRidesList: document.getElementById('past-rides-list'),
        scheduledRidesList: document.getElementById('scheduled-rides-list'),
        
        // Booking modal
        bookingModal: document.getElementById('booking-modal'),
        bookingDetails: document.getElementById('booking-details'),
        closeModalBtns: document.querySelectorAll('.close-modal'),
        
        // Navigation
        hamburgerBtn: document.querySelector('.hamburger'),
        navLinks: document.querySelector('.nav-links'),
        body: document.body,
        
        // Modal close buttons
        modalCloseBtns: document.querySelectorAll('.modal-close'),
        
        // Tab switching
        switchToSignup: document.getElementById('switch-to-signup')
    };
    
    // Set the minimum date for the date picker to today
    if (window.elements.rideDateInput) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        window.elements.rideDateInput.min = formattedDate;
        window.elements.rideDateInput.value = formattedDate;
    }
    
    // Set a reasonable default time (1 hour from now)
    if (window.elements.rideTimeInput) {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        window.elements.rideTimeInput.value = `${hours}:${minutes}`;
    }
}

// Function to set up device-specific elements
function setupDeviceSpecificElements() {
    const currentLocationBtn = document.getElementById('current-location');
    const desktopMessage = document.querySelector('.desktop-location-message');
    
    if (!currentLocationBtn) return;
    
    if (isMobileDevice()) {
        // Show the button on mobile devices
        currentLocationBtn.style.display = 'flex';
        if (desktopMessage) desktopMessage.style.display = 'none';
    } else {
        // Hide the button on desktop/PC
        currentLocationBtn.style.display = 'none';
        if (desktopMessage) desktopMessage.style.display = 'block';
    }
}

// Function to set up all event listeners
function setupEventListeners() {
    const el = window.elements;
    
    // Form submission
    if (el.rideForm) el.rideForm.addEventListener('submit', handleBooking);
    
    // Booking tabs
    el.bookingTabs.forEach(tab => {
        tab.addEventListener('click', () => switchBookingTab(tab.dataset.tab));
    });
    
    // Map controls
    if (el.currentLocationBtn) el.currentLocationBtn.addEventListener('click', getCurrentLocation);
    if (el.pickupBtn) el.pickupBtn.addEventListener('click', selectOnMap);
    if (el.destinationBtn) el.destinationBtn.addEventListener('click', selectDestination);
    
    // Account buttons
    if (el.loginBtn) el.loginBtn.addEventListener('click', () => openModal(el.loginModal));
    if (el.accountLink) el.accountLink.addEventListener('click', handleAccountClick);
    
    // Account forms
    if (el.loginForm) el.loginForm.addEventListener('submit', handleLogin);
    if (el.editProfileForm) el.editProfileForm.addEventListener('submit', handleProfileUpdate);
    
    // Dashboard tabs
    el.dashboardTabs.forEach(tab => {
        tab.addEventListener('click', () => switchDashboardTab(tab.dataset.tab));
    });
    
    // Profile actions
    if (el.editProfileBtn) el.editProfileBtn.addEventListener('click', toggleEditProfile);
    if (el.cancelEditBtn) el.cancelEditBtn.addEventListener('click', toggleEditProfile);
    if (el.logoutBtn) el.logoutBtn.addEventListener('click', handleLogout);
    
    // Close modals
    el.modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close specific modal buttons
    el.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Mobile navigation
    if (el.hamburgerBtn) {
        el.hamburgerBtn.addEventListener('click', () => {
            el.body.classList.toggle('nav-active');
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            el.body.classList.remove('nav-active');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (el.body.classList.contains('nav-active') && 
            !e.target.closest('.nav-links') && 
            !e.target.closest('.hamburger')) {
            el.body.classList.remove('nav-active');
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
    
    // Switch to signup page
    if (el.switchToSignup) el.switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(el.loginModal);
        window.location.href = 'signup.html';
    });
    
    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Change icon
            const svg = this.querySelector('svg');
            if (type === 'text') {
                svg.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                svg.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    });
    
    // Edit and cancel scheduled rides
    document.querySelectorAll('.edit-ride').forEach(btn => {
        btn.addEventListener('click', function() {
            const rideItem = this.closest('.ride-item');
            // In a real app, we would handle editing here
            alert('Edit functionality would open a form to modify this scheduled ride.');
        });
    });
    
    document.querySelectorAll('.cancel-ride').forEach(btn => {
        btn.addEventListener('click', function() {
            const rideItem = this.closest('.ride-item');
            if (confirm('Are you sure you want to cancel this scheduled ride?')) {
                // In a real app, we would handle cancellation here
                rideItem.remove();
                checkEmptyRides();
            }
        });
    });
    
    // Tab focus handlers for map marker selection
    if (el.pickupInput) {
        el.pickupInput.addEventListener('focus', () => {
            window.selectedMode = 'pickup';
        });
    }
    
    if (el.destinationInput) {
        el.destinationInput.addEventListener('focus', () => {
            window.selectedMode = 'destination';
        });
    }
}

// Initialize UI based on current state
function initializeUI() {
    const el = window.elements;
    
    // Check local storage for login state
    checkLoginState();
    
    // Add pulse animation to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.animation = 'pulse 0.5s ease';
        });
        
        button.addEventListener('animationend', () => {
            button.style.animation = '';
        });
    });
    
    // Set the default booking mode to "now"
    switchBookingTab('now');
    
    // Check empty ride lists
    checkEmptyRides();
    
    // Set up device-specific elements
    setupDeviceSpecificElements();
}

// Setup animations
function setupAnimations() {
    // Animation on scroll - with performance optimization for mobile
    let isMobile = window.innerWidth <= 768;

    function animateOnScroll() {
        if (isMobile && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Skip animations if user prefers reduced motion
            const elements = document.querySelectorAll('.animate-fadeIn, .animate-slideUp, .animate-slideRight, .animate-slideLeft');
            elements.forEach(el => el.style.opacity = '1');
            return;
        }
        
        const elements = document.querySelectorAll('.animate-fadeIn, .animate-slideUp, .animate-slideRight, .animate-slideLeft');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 50) {
                element.style.opacity = '1';
                element.style.animation = element.classList.contains('animate-fadeIn') ? 'fadeIn 1s ease forwards' :
                                         element.classList.contains('animate-slideUp') ? 'slideUp 0.8s ease forwards' :
                                         element.classList.contains('animate-slideRight') ? 'slideRight 0.8s ease forwards' :
                                         'slideLeft 0.8s ease forwards';
            }
        });
    }

    // Throttle function to limit execution frequency
    function throttle(callback, limit) {
        let waiting = false;
        return function() {
            if (!waiting) {
                callback.apply(this, arguments);
                waiting = true;
                setTimeout(function() {
                    waiting = false;
                }, limit);
            }
        };
    }

    // Add passive event listeners for better mobile performance
    document.addEventListener('touchstart', function() {}, {passive: true});
    document.addEventListener('touchmove', function() {}, {passive: true});

    // Initial animation check on load and add scroll event listener
    animateOnScroll();
    window.addEventListener('scroll', throttle(animateOnScroll, 100));

    // Update isMobile state on resize
    window.addEventListener('resize', throttle(() => {
        isMobile = window.innerWidth <= 768;
    }, 100));
}

// Function to place a marker on the map
function placeMarker(location, type = window.selectedMode) {
    if (!window.map || !google) return;

    // If this is a LatLng object, convert it to a plain object
    let position;
    if (location instanceof google.maps.LatLng) {
        position = {
            lat: location.lat(),
            lng: location.lng()
        };
    } else {
        position = location;
    }
    
    // Remove existing marker of the same type
    window.markers = window.markers.filter(marker => {
        if (marker.type === type) {
            marker.setMap(null);
            return false;
        }
        return true;
    });
    
    // Create a new marker using the recommended AdvancedMarkerElement class if available
    let marker;
    
    try {
        // Check if the advanced marker API is available
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            // Use the new AdvancedMarkerElement (recommended)
            const markerView = new google.maps.marker.AdvancedMarkerElement({
                map: window.map,
                position: position,
                title: type === 'pickup' ? 'Pickup Location' : 'Destination',
                content: buildAdvancedMarkerContent(type)
            });
            
            // Add custom properties 
            markerView.type = type;
            markerView.setMap = function(map) {
                if (map === null) {
                    this.map = null;
                } else {
                    this.map = map;
                }
            };
            
            marker = markerView;
        } else {
            // Fallback to standard Marker if AdvancedMarkerElement is not available
            marker = new google.maps.Marker({
                position: position,
                map: window.map,
                animation: google.maps.Animation.DROP,
                icon: type === 'pickup' ? 
                    'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
                    'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
            
            // Add the type property to the marker
            marker.type = type;
        }
    } catch (error) {
        console.warn('Error creating advanced marker, falling back to standard marker:', error);
        
        // Fallback to standard Marker
        marker = new google.maps.Marker({
            position: position,
            map: window.map,
            animation: google.maps.Animation.DROP,
            icon: type === 'pickup' ? 
                'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
                'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
        
        // Add the type property to the marker
        marker.type = type;
    }
    
    // Add the marker to our array
    window.markers.push(marker);
    
    // Update the input field with the address
    window.geocoder.geocode({ 'location': position }, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {
                if (type === 'pickup') {
                    document.getElementById('pickup').value = results[0].formatted_address;
                } else {
                    document.getElementById('destination').value = results[0].formatted_address;
                }
                
                // Calculate and display the route if both markers are present
                calculateAndDisplayRoute();
            }
        }
    });
}

// Helper function to create custom HTML content for advanced markers
function buildAdvancedMarkerContent(type) {
    // Create a custom pin element
    const pinElement = document.createElement('div');
    
    // Style based on marker type
    if (type === 'pickup') {
        pinElement.innerHTML = `
            <div style="
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                background: #00b894;
                transform: rotate(-45deg);
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                border: 2px solid white;
            ">
                <div style="
                    transform: rotate(45deg);
                    width: 14px;
                    height: 14px;
                    background: white;
                    border-radius: 50%;
                "></div>
            </div>
        `;
    } else {
        pinElement.innerHTML = `
            <div style="
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                background: #e74c3c;
                transform: rotate(-45deg);
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                border: 2px solid white;
            ">
                <div style="
                    transform: rotate(45deg);
                    width: 14px;
                    height: 14px;
                    background: white;
                    border-radius: 50%;
                "></div>
            </div>
        `;
    }
    
    return pinElement;
}

// Function to calculate and display the route between markers
function calculateAndDisplayRoute() {
    if (!window.directionsService || !window.directionsRenderer) return;
    
    // Check if we have both a pickup and destination marker
    const pickupMarker = window.markers.find(marker => marker.type === 'pickup');
    const destinationMarker = window.markers.find(marker => marker.type === 'destination');
    
    if (pickupMarker && destinationMarker) {
        window.directionsService.route(
            {
                origin: pickupMarker.position || pickupMarker.position,
                destination: destinationMarker.position || destinationMarker.position,
                travelMode: google.maps.TravelMode.DRIVING
            },
            function(response, status) {
                if (status === 'OK') {
                    window.directionsRenderer.setDirections(response);
                }
            }
        );
    }
}

// Booking Functions
function handleBooking(e) {
    e.preventDefault();
    
    const el = window.elements;
    
    // Validate form
    if (!el.pickupInput.value || !el.nameInput.value || !el.phoneInput.value || !el.carTypeSelect.value) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Additional validation for scheduled rides
    if (window.isScheduled) {
        if (!el.rideDateInput.value || !el.rideTimeInput.value) {
            alert('Please select both date and time for your scheduled ride');
            return;
        }
        
        // Validate that the scheduled time is in the future
        const now = new Date();
        const scheduledDateTime = new Date(
            `${el.rideDateInput.value}T${el.rideTimeInput.value}`
        );
        
        if (scheduledDateTime <= now) {
            alert('Please select a future date and time for your scheduled ride');
            return;
        }
    }
    
    // Submit booking
    const submitBtn = el.rideSubmitBtn;
    submitBtn.innerHTML = '<span class="btn-loading"></span>Processing';
    submitBtn.disabled = true;
    
    // In a real application, this would send the data to a server
    
    // Store the booking in localStorage if user is logged in
    if (window.isLoggedIn) {
        saveBooking();
    }
    
    // Display booking confirmation
    setTimeout(() => {
        showBookingConfirmation();
        
        // Reset form and button state
        el.rideForm.reset();
        submitBtn.innerHTML = 'Request Ride';
        submitBtn.disabled = false;
        
        // Clear markers
        window.markers.forEach(marker => marker.setMap(null));
        window.markers = [];
        
        // Clear directions
        if (window.directionsRenderer) {
            window.directionsRenderer.setDirections({routes: []});
        }
    }, 1500); // Simulate server processing time
}

function saveBooking() {
    const el = window.elements;
    
    // Create a booking object
    const booking = {
        id: `booking-${Date.now()}`,
        pickup: el.pickupInput.value,
        destination: el.destinationInput.value || 'Not specified',
        name: el.nameInput.value,
        phone: el.phoneInput.value,
        carType: el.carTypeSelect.value,
        notes: el.notesInput.value || '',
        scheduled: window.isScheduled,
        timestamp: Date.now()
    };
    
    // Add scheduled ride details if applicable
    if (window.isScheduled) {
        booking.date = el.rideDateInput.value;
        booking.time = el.rideTimeInput.value;
        booking.scheduledTimestamp = new Date(`${booking.date}T${booking.time}`).getTime();
    }
    
    // Get existing bookings from localStorage
    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    
    // Add the new booking
    bookings.push(booking);
    
    // Save to localStorage
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // Update UI if account dashboard is open
    updateDashboard();
}

function showBookingConfirmation() {
    const el = window.elements;
    
    if (!el.bookingModal || !el.bookingDetails) return;
    
    // Format booking details
    let detailsHTML = '';
    
    if (window.isScheduled) {
        const date = new Date(`${el.rideDateInput.value}T${el.rideTimeInput.value}`);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        detailsHTML = `
            <div class="booking-confirmation">
                <p><strong>Your ride has been scheduled for:</strong></p>
                <p class="scheduled-time">${formattedDate} at ${formattedTime}</p>
                <div class="booking-route">
                    <div class="route-point">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>${el.pickupInput.value}</span>
                    </div>
                    <div class="route-line"></div>
                    <div class="route-point">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${el.destinationInput.value || 'Not specified'}</span>
                    </div>
                </div>
                <p class="confirmation-message">We'll notify you 15 minutes before pickup time.</p>
            </div>
        `;
    } else {
        detailsHTML = `
            <div class="booking-confirmation">
                <p><strong>A driver will be assigned to you shortly.</strong></p>
                <div class="booking-route">
                    <div class="route-point">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>${el.pickupInput.value}</span>
                    </div>
                    <div class="route-line"></div>
                    <div class="route-point">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${el.destinationInput.value || 'Not specified'}</span>
                    </div>
                </div>
                <p class="confirmation-message">You will receive a notification when your driver arrives.</p>
            </div>
        `;
    }
    
    // Update the modal content
    el.bookingDetails.innerHTML = detailsHTML;
    
    // Show modal with animation
    openModal(el.bookingModal);
}

// Account Management Functions
function handleLogin(e) {
    e.preventDefault();
    
    const el = window.elements;
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // In a real app, we would validate credentials against a server
    // For demo purposes, we'll accept any input and simulate a login
    
    // Simulate login process
    const loginBtn = e.target.querySelector('button[type="submit"]');
    loginBtn.innerHTML = '<span class="btn-loading"></span>Logging in...';
    loginBtn.disabled = true;
    
    setTimeout(() => {
        // Create user data
        window.userData = {
            name: 'John Doe', // Demo name
            email: email,
            phone: '+592 123-4567', // Demo phone
            totalRides: 12,
            upcomingRides: 2
        };
        
        // Save to localStorage
        localStorage.setItem('userData', JSON.stringify(window.userData));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Update login state
        window.isLoggedIn = true;
        
        // Update UI
        updateUIForLoggedInUser();
        
        // Close login modal
        closeModal(el.loginModal);
        
        // Reset form and button
        el.loginForm.reset();
        loginBtn.innerHTML = 'Login';
        loginBtn.disabled = false;
        
        // Show success message
        showNotification('Welcome back! You are now logged in.', 'success');
    }, 1500); // Simulate server processing
}

function handleLogout() {
    // Clear user data and localStorage
    window.userData = null;
    window.isLoggedIn = false;
    
    localStorage.removeItem('userData');
    localStorage.setItem('isLoggedIn', 'false');
    
    // Update UI
    updateUIForLoggedOutUser();
    
    // Close account modal
    closeModal(window.elements.accountModal);
    
    // Show notification
    showNotification('You have been logged out.', 'info');
}

function handleAccountClick(e) {
    e.preventDefault();
    
    // If user is logged in, show the account dashboard
    // If not, show the login modal
    if (window.isLoggedIn) {
        updateDashboard();
        openModal(window.elements.accountModal);
    } else {
        openModal(window.elements.loginModal);
    }
}

function handleProfileUpdate(e) {
    e.preventDefault();
    
    const el = window.elements;
    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    
    // Update user data
    window.userData.name = name;
    window.userData.email = email;
    window.userData.phone = phone;
    
    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(window.userData));
    
    // Update UI
    updateProfileDisplay();
    
    // Hide edit form
    toggleEditProfile();
    
    // Show success message
    showNotification('Profile updated successfully!', 'success');
}

function updateProfileDisplay() {
    const el = window.elements;
    
    if (window.userData) {
        // Update profile info in the dashboard
        el.profileName.textContent = window.userData.name;
        el.profileEmail.textContent = window.userData.email;
        el.profilePhone.textContent = window.userData.phone;
        
        // Update edit form values
        document.getElementById('edit-name').value = window.userData.name;
        document.getElementById('edit-email').value = window.userData.email;
        document.getElementById('edit-phone').value = window.userData.phone;
        
        // Update ride statistics
        document.getElementById('total-rides').textContent = window.userData.totalRides;
        document.getElementById('upcoming-rides').textContent = window.userData.upcomingRides;
    }
}

// Dashboard Management
function updateDashboard() {
    if (!window.isLoggedIn) return;
    
    // Update profile display
    updateProfileDisplay();
    
    // Update ride history
    updateRideHistory();
    
    // Update scheduled rides
    updateScheduledRides();
}

function updateRideHistory() {
    // In a real app, we would fetch this data from a server
    // For demo purposes, we'll just use the demo data
    // This would be replaced with actual data in a production app
}

function updateScheduledRides() {
    // In a real app, we would fetch this data from a server
    // For demo purposes, we'll just use demo data
    // This would be replaced with actual data in a production app
    
    // Check if there are any scheduled rides and update empty state
    checkEmptyRides();
}

// Utility Functions
function openModal(modal) {
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.opacity = '0';
    }
    
    // Fade in modal
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transition = 'opacity 0.3s ease';
        
        if (modalContent) {
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
            modalContent.style.transition = 'all 0.3s ease';
        }
    }, 10);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    if (!modal) return;
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'scale(1.1)';
        modalContent.style.opacity = '0';
        modalContent.style.transition = 'all 0.3s ease';
    }
    
    // Fade out modal
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';
    
    // Hide modal after animation
    setTimeout(() => {
        modal.style.display = 'none';
        
        // Reset tab display for dashboard
        if (modal.id === 'account-modal') {
            switchDashboardTab('profile');
        }
    }, 300);
    
    // Unlock body scroll
    document.body.style.overflow = '';
}

function switchBookingTab(tab) {
    const el = window.elements;
    
    // Update tab buttons
    el.bookingTabs.forEach(tabEl => {
        if (tabEl.dataset.tab === tab) {
            tabEl.classList.add('active');
        } else {
            tabEl.classList.remove('active');
        }
    });
    
    // Show/hide schedule options
    if (tab === 'schedule') {
        window.isScheduled = true;
        el.scheduleOptions.style.display = 'block';
        el.rideSubmitBtn.innerText = 'Schedule Ride';
        
        // Show animation
        el.scheduleOptions.style.opacity = '0';
        el.scheduleOptions.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            el.scheduleOptions.style.opacity = '1';
            el.scheduleOptions.style.transform = 'translateY(0)';
            el.scheduleOptions.style.transition = 'all 0.3s ease';
        }, 10);
    } else {
        window.isScheduled = false;
        
        // Fade out animation
        el.scheduleOptions.style.opacity = '0';
        el.scheduleOptions.style.transform = 'translateY(-10px)';
        el.scheduleOptions.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            el.scheduleOptions.style.display = 'none';
            el.rideSubmitBtn.innerText = 'Request Ride';
        }, 300);
    }
}

function switchDashboardTab(tab) {
    const el = window.elements;
    
    // Update tab buttons
    el.dashboardTabs.forEach(tabEl => {
        if (tabEl.dataset.tab === tab) {
            tabEl.classList.add('active');
        } else {
            tabEl.classList.remove('active');
        }
    });
    
    // Show corresponding panel
    el.dashboardPanels.forEach(panel => {
        if (panel.id === `${tab}-panel`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
}

function checkEmptyRides() {
    const el = window.elements;
    
    // Past rides empty state
    const pastRides = el.pastRidesList.querySelectorAll('.ride-item');
    const pastRidesEmpty = el.pastRidesList.querySelector('.empty-state');
    
    if (pastRides.length === 0 && pastRidesEmpty) {
        pastRidesEmpty.style.display = 'flex';
    } else if (pastRidesEmpty) {
        pastRidesEmpty.style.display = 'none';
    }
    
    // Scheduled rides empty state
    const scheduledRides = el.scheduledRidesList.querySelectorAll('.ride-item');
    const scheduledRidesEmpty = el.scheduledRidesList.querySelector('.empty-state');
    
    if (scheduledRides.length === 0 && scheduledRidesEmpty) {
        scheduledRidesEmpty.style.display = 'flex';
    } else if (scheduledRidesEmpty) {
        scheduledRidesEmpty.style.display = 'none';
    }
}

function toggleEditProfile() {
    const el = window.elements;
    const profileInfo = el.profilePanel.querySelector('.profile-info');
    const profileStats = el.profilePanel.querySelector('.profile-stats');
    
    if (el.editProfileForm.style.display === 'none') {
        // Show edit form
        profileInfo.style.display = 'none';
        profileStats.style.display = 'none';
        el.editProfileForm.style.display = 'block';
    } else {
        // Hide edit form
        el.editProfileForm.style.display = 'none';
        profileInfo.style.display = 'flex';
        profileStats.style.display = 'flex';
    }
}

function checkLoginState() {
    // Check if user is logged in from localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = localStorage.getItem('userData');
    
    if (isLoggedIn && userData) {
        window.isLoggedIn = true;
        window.userData = JSON.parse(userData);
        
        // Update UI for logged in user
        updateUIForLoggedInUser();
    } else {
        window.isLoggedIn = false;
        window.userData = null;
        
        // Update UI for logged out user
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    const el = window.elements;
    
    // Hide login/signup buttons
    el.accountButtons.style.display = 'none';
    
    // Show account link
    el.accountLink.style.display = 'block';
    el.accountLink.textContent = `Hi, ${window.userData.name.split(' ')[0]}`;
    
    // Update name field in booking form if empty
    if (el.nameInput.value === '') {
        el.nameInput.value = window.userData.name;
    }
    
    // Update phone field in booking form if empty
    if (el.phoneInput.value === '') {
        el.phoneInput.value = window.userData.phone;
    }
}

function updateUIForLoggedOutUser() {
    const el = window.elements;
    
    // Show login/signup buttons
    el.accountButtons.style.display = 'flex';
    
    // Update account link
    el.accountLink.style.display = 'block';
    el.accountLink.textContent = 'My Account';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${type === 'success' 
                  ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                  : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
            </svg>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    // Add to the document body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(110%)';
        notification.style.opacity = '0';
        
        // Remove from DOM after animation
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Function to handle the destination map button click
function selectDestination() {
    window.selectedMode = 'destination';
    // Focus the input field and change the map mode
    const destinationInput = document.getElementById('destination');
    if (destinationInput) {
        destinationInput.focus();
    }
    
    // Set a visual indicator that we're in destination selection mode (optional)
    if (window.map) {
        window.map.setOptions({
            draggableCursor: 'crosshair'
        });
    }
}

// Function to handle the pickup map button click
function selectOnMap() {
    window.selectedMode = 'pickup';
    // Focus the input field and change the map mode
    const pickupInput = document.getElementById('pickup');
    if (pickupInput) {
        pickupInput.focus();
    }
    
    // Set a visual indicator that we're in pickup selection mode (optional)
    if (window.map) {
        window.map.setOptions({
            draggableCursor: 'crosshair'
        });
    }
}

function getCurrentLocation() {
    const currentLocationBtn = document.getElementById('current-location');
    const pickupInput = document.getElementById('pickup');
    
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser. Please enter your location manually.");
        return;
    }
    
    // Update selected mode
    window.selectedMode = 'pickup';
    
    if (currentLocationBtn) {
        currentLocationBtn.classList.add('btn-loading');
        currentLocationBtn.innerText = "Locating...";
    }
    
    if (pickupInput) {
        pickupInput.value = "Getting your location...";
    }
    
    // Try first with high accuracy
    tryGeolocate(true);
    
    // Function to attempt geolocation with fallbacks
    function tryGeolocate(highAccuracy) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy; // Accuracy in meters
                const currentLocation = new google.maps.LatLng(lat, lng);
                
                console.log(`Location obtained with accuracy: ${accuracy} meters`);
                
                // Center the map on the current location
                if (window.map) {
                    window.map.setCenter(currentLocation);
                    // Adjust zoom based on accuracy
                    const zoomLevel = accuracy < 100 ? 18 : 
                                    accuracy < 500 ? 17 : 
                                    accuracy < 1000 ? 16 : 15;
                    window.map.setZoom(zoomLevel);
                }
                
                // Use improved reverse geocoding
                enhancedReverseGeocode(currentLocation, accuracy);
                
                if (currentLocationBtn) {
                    currentLocationBtn.classList.remove('btn-loading');
                    currentLocationBtn.innerText = "Use Current Location";
                }
            },
            // Error callback - with fallback to less accurate method
            (error) => {
                console.warn(`Geolocation error (highAccuracy=${highAccuracy}):`, error.code, error.message);
                
                // If high accuracy failed, try with lower accuracy
                if (highAccuracy) {
                    console.log("High accuracy location failed, trying with lower accuracy...");
                    tryGeolocate(false);
                    return;
                }
                
                // Reset button if all attempts failed
                if (currentLocationBtn) {
                    currentLocationBtn.classList.remove('btn-loading');
                    currentLocationBtn.innerText = "Use Current Location";
                }
                
                let errorMsg = "Unable to access your precise location. ";
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg += "Please check your browser's location permissions and make sure they're enabled for this site.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg += "Location information is unavailable. On PCs, this may be due to lack of GPS hardware.";
                        break;
                    case error.TIMEOUT:
                        errorMsg += "The request timed out. Please ensure you have a stable internet connection and try again.";
                        break;
                    default:
                        errorMsg += "An unknown error occurred. Please try entering your location manually.";
                        break;
                }
                
                if (pickupInput) {
                    pickupInput.value = "";
                }
                
                // Display error as notification rather than alert
                showNotification(errorMsg, "error");
            },
            // Options
            {
                enableHighAccuracy: highAccuracy,
                timeout: highAccuracy ? 10000 : 15000, // Longer timeout for fallback
                maximumAge: highAccuracy ? 0 : 60000 // Allow cached results for fallback
            }
        );
    }
    
    // Enhanced reverse geocoding with better address resolution
    function enhancedReverseGeocode(location, accuracy) {
        if (!window.geocoder) return;
        
        // Place a marker immediately while we wait for the address
        placeMarker(location, 'pickup');
        
        // Use geocoder to get address
        window.geocoder.geocode({ 'location': location }, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    // Get the most accurate result
                    let bestResult = results[0];
                    
                    // Try to find a result that has a street address rather than just a region
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].types.includes('street_address') || 
                            results[i].types.includes('premise') ||
                            results[i].types.includes('route')) {
                            bestResult = results[i];
                            break;
                        }
                    }
                    
                    // Update pickup input with the formatted address
                    if (pickupInput) {
                        pickupInput.value = bestResult.formatted_address;
                        
                        // Add a small animation to the input
                        pickupInput.style.backgroundColor = 'rgba(0, 184, 148, 0.2)';
                        setTimeout(() => {
                            pickupInput.style.transition = 'background-color 0.5s ease';
                            pickupInput.style.backgroundColor = '';
                        }, 1000);
                    }
                    
                    // If accuracy is low, inform the user
                    if (accuracy > 500) {
                        showNotification(`Location found, but accuracy is approximately ${Math.round(accuracy)}m. You may need to adjust the pin for a more precise pickup location.`, "info");
                    }
                } else {
                    console.warn('No results found for geocoding');
                    showNotification("Location found, but we couldn't determine the address. Please enter it manually or adjust the pin for better accuracy.", "warning");
                }
            } else {
                console.error('Geocoder failed due to: ' + status);
                if (pickupInput) {
                    pickupInput.value = `Location (${location.lat().toFixed(5)}, ${location.lng().toFixed(5)})`;
                }
                showNotification("We found your coordinates but couldn't convert them to an address. You may need to enter it manually.", "warning");
            }
            
            // Calculate and display the route if destination is set
            calculateAndDisplayRoute();
        });
    }
}

// Debug function to help troubleshoot map and location issues
function debugMapVisibility() {
    // Elements to check
    const mapContainer = document.querySelector('.map-container');
    const map = document.getElementById('map');
    const mapFallback = document.getElementById('map-fallback');
    const mapControls = document.querySelector('.map-controls');
    const currentLocationBtn = document.getElementById('current-location');
    
    // Check if elements exist
    console.log('Map container exists:', !!mapContainer);
    console.log('Map element exists:', !!map);
    console.log('Map fallback exists:', !!mapFallback);
    console.log('Map controls exists:', !!mapControls);
    console.log('Current location button exists:', !!currentLocationBtn);
    
    // Check display values
    if (mapContainer) {
        const mapContainerStyle = window.getComputedStyle(mapContainer);
        console.log('Map container display:', mapContainerStyle.display);
        console.log('Map container visibility:', mapContainerStyle.visibility);
        console.log('Map container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
    }
    
    if (map) {
        const mapStyle = window.getComputedStyle(map);
        console.log('Map display:', mapStyle.display);
        console.log('Map visibility:', mapStyle.visibility);
    }
    
    if (mapControls) {
        const mapControlsStyle = window.getComputedStyle(mapControls);
        console.log('Map controls display:', mapControlsStyle.display);
    }
    
    if (currentLocationBtn) {
        const btnStyle = window.getComputedStyle(currentLocationBtn);
        console.log('Location button display:', btnStyle.display);
    }
    
    // Check device type
    console.log('Is mobile (by size):', window.innerWidth <= 768);
    console.log('Is mobile (by agent):', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    console.log('Window width:', window.innerWidth);
}
