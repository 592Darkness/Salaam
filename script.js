// Make initMap function global for Google Maps callback
window.initMap = function() {
    try {
        console.log("Initializing map...");
        
        // Check if the map element exists
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Map element not found');
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
            google.maps.event.addDomListener(document.getElementById('pickup'), 'keydown', function(e) {
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
            google.maps.event.addDomListener(document.getElementById('destination'), 'keydown', function(e) {
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

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const rideForm = document.getElementById('ride-form');
    const bookingModal = document.getElementById('booking-modal');
    const bookingDetails = document.getElementById('booking-details');
    const closeModalBtn = document.querySelector('.close-modal');
    const currentLocationBtn = document.getElementById('current-location');
    const hamburgerBtn = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;
    const pickupInput = document.getElementById('pickup');
    const destinationInput = document.getElementById('destination');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const carTypeSelect = document.getElementById('car-type');
    const notesInput = document.getElementById('notes');
    
    // Mobile Navigation
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            body.classList.toggle('nav-active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            body.classList.remove('nav-active');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (body.classList.contains('nav-active') && 
            !e.target.closest('.nav-links') && 
            !e.target.closest('.hamburger')) {
            body.classList.remove('nav-active');
        }
    });

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

    // Event Listeners
    if (rideForm) rideForm.addEventListener('submit', handleBooking);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (currentLocationBtn) currentLocationBtn.addEventListener('click', getCurrentLocation);
    
    const destinationBtn = document.getElementById('destination-btn');
    const pickupBtn = document.getElementById('pickup-btn');
    
    if (destinationBtn) destinationBtn.addEventListener('click', selectDestination);
    if (pickupBtn) pickupBtn.addEventListener('click', selectOnMap);

    // Add passive event listeners for better mobile performance
    document.addEventListener('touchstart', function() {}, {passive: true});
    document.addEventListener('touchmove', function() {}, {passive: true});

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

    // Initial animation check on load and add scroll event listener
    animateOnScroll();
    window.addEventListener('scroll', throttle(animateOnScroll, 100));

    // Update isMobile state on resize
    window.addEventListener('resize', throttle(() => {
        isMobile = window.innerWidth <= 768;
    }, 100));
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            closeModal();
        }
    });
    
    // Add input focus handlers
    if (pickupInput) {
        pickupInput.addEventListener('focus', () => {
            window.selectedMode = 'pickup';
        });
    }
    
    if (destinationInput) {
        destinationInput.addEventListener('focus', () => {
            window.selectedMode = 'destination';
        });
    }
});

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
    
    // Create a new marker
    const marker = new google.maps.Marker({
        position: position,
        map: window.map,
        animation: google.maps.Animation.DROP,
        icon: type === 'pickup' ? 
            'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
            'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
    });
    
    // Add the type property to the marker
    marker.type = type;
    
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

// Function to calculate and display the route between markers
function calculateAndDisplayRoute() {
    if (!window.directionsService || !window.directionsRenderer) return;
    
    // Check if we have both a pickup and destination marker
    const pickupMarker = window.markers.find(marker => marker.type === 'pickup');
    const destinationMarker = window.markers.find(marker => marker.type === 'destination');
    
    if (pickupMarker && destinationMarker) {
        window.directionsService.route(
            {
                origin: pickupMarker.position,
                destination: destinationMarker.position,
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

// Functions
function handleBooking(e) {
    e.preventDefault();
    
    const pickupInput = document.getElementById('pickup');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const carTypeSelect = document.getElementById('car-type');
    
    // Validate form
    if (!pickupInput.value || !nameInput.value || !phoneInput.value || !carTypeSelect.value) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Submit booking
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<span class="btn-loading"></span>Processing';
    submitBtn.disabled = true;
    
    // In a real application, this would send the data to a server
    // and process the response
    
    // Display booking confirmation
    showBookingConfirmation();
    
    // Reset form and button state
    e.target.reset();
    submitBtn.innerHTML = 'Request Ride';
    submitBtn.disabled = false;
    
    // Clear markers
    window.markers.forEach(marker => marker.setMap(null));
    window.markers = [];
    
    // Clear directions
    if (window.directionsRenderer) {
        window.directionsRenderer.setDirections({routes: []});
    }
}

function showBookingConfirmation() {
    const bookingModal = document.getElementById('booking-modal');
    const bookingDetails = document.getElementById('booking-details');
    
    // Show modal with animation
    bookingModal.style.display = 'flex';
    bookingModal.style.opacity = '0';
    
    // Display booking details
    bookingDetails.innerHTML = `
        <p><strong>Your booking has been confirmed!</strong></p>
        <p>A driver will be assigned to you shortly and will contact you at the provided number.</p>
    `;
    
    setTimeout(() => {
        bookingModal.style.opacity = '1';
        bookingModal.style.transition = 'opacity 0.3s ease';
        
        const modalContent = document.querySelector('.modal-content');
        modalContent.style.transform = 'scale(0.8)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
            modalContent.style.transition = 'all 0.3s ease';
        }, 100);
    }, 50);
}

function closeModal() {
    const bookingModal = document.getElementById('booking-modal');
    const modalContent = document.querySelector('.modal-content');
    
    modalContent.style.transform = 'scale(1.1)';
    modalContent.style.opacity = '0';
    modalContent.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
        bookingModal.style.opacity = '0';
        bookingModal.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            bookingModal.style.display = 'none';
        }, 300);
    }, 200);
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
    }
    
    if (pickupInput) {
        pickupInput.value = "Getting your location...";
    }
    
    navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const currentLocation = new google.maps.LatLng(lat, lng);
            
            // Center the map on the current location
            if (window.map) {
                window.map.setCenter(currentLocation);
                window.map.setZoom(17);
            }
            
            // Place a marker at the current location
            placeMarker(currentLocation, 'pickup');
            
            if (currentLocationBtn) {
                currentLocationBtn.classList.remove('btn-loading');
            }
            
            // Add a small animation to the input
            if (pickupInput) {
                pickupInput.style.backgroundColor = 'rgba(0, 184, 148, 0.2)';
                setTimeout(() => {
                    pickupInput.style.transition = 'background-color 0.5s ease';
                    pickupInput.style.backgroundColor = '';
                }, 1000);
            }
        },
        // Error callback - improved error message
        (error) => {
            if (currentLocationBtn) {
                currentLocationBtn.classList.remove('btn-loading');
            }
            
            let errorMsg = "Unable to access your location. ";
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += "Please check your browser's location permissions.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMsg += "The request timed out. Please try again.";
                    break;
                default:
                    errorMsg += "An unknown error occurred.";
                    break;
            }
            
            if (pickupInput) {
                pickupInput.value = "";
            }
            
            // Display error in more user-friendly way
            alert(errorMsg);
        },
        // Options - reduced timeout for better UX
        {
            enableHighAccuracy: true,
            timeout: 7000, // Reduced from 10000
            maximumAge: 0
        }
    );
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
