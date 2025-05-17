// This script handles real-time notifications for account linking

// Function to get JWT token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Function to get user ID from token
function getUserIdFromToken() {
    const token = getToken();
    if (!token) return null;
    
    try {
        // Extract the payload part of the JWT
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        return payload.id; // or payload.sub depending on your token structure
    } catch (e) {
        console.error('Error extracting user ID from token:', e);
        return null;
    }
}

// Connect to server events when the user is authenticated
function connectToEvents() {
    const userId = getUserIdFromToken();
    if (!userId) {
        console.log('User not authenticated, skipping SSE connection');
        return;
    }
    
    // Create an EventSource to receive Server-Sent Events
    const evtSource = new EventSource(`/api/events?userId=${userId}`);
    
    // Handle connection open
    evtSource.onopen = () => {
        console.log('Connected to event stream');
    };
    
    // Handle connection error
    evtSource.onerror = (err) => {
        console.error('Event stream error:', err);
        evtSource.close();
        
        // Try to reconnect after a delay
        setTimeout(connectToEvents, 5000);
    };
    
    // Handle incoming messages
    evtSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Received event:', data);
            
            // Handle different event types
            if (data.type === 'account_linked') {
                handleAccountLinked(data);
            }
        } catch (e) {
            console.error('Error processing event:', e);
        }
    };
    
    // Store the EventSource so we can close it later if needed
    window.eventSource = evtSource;
}

// Handle account linked event
function handleAccountLinked(data) {
    console.log('Account linked!', data);
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>${data.message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Refresh the page or update UI elements
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Connect to events if the user is authenticated
    if (getToken()) {
        connectToEvents();
    }
    
    // Listen for login events to connect after login
    document.addEventListener('user-authenticated', () => {
        connectToEvents();
    });
});

// Handle login form submission
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        // After successful login, trigger an event
        document.dispatchEvent(new CustomEvent('user-authenticated'));
    });
}