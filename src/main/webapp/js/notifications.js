class NotificationManager {
    constructor() {
        this.notificationBtn = document.getElementById('notifications');
        this.dropdown = document.getElementById('notification-dropdown');
        this.badge = document.getElementById('notification-count');
        this.notifications = [];
        
        this.initEventListeners();
        this.loadNotifications(); // Simulated initial load
    }

    initEventListeners() {
        // Toggle dropdown on click
        this.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.notificationBtn.contains(e.target) && 
                !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    toggleDropdown() {
        this.dropdown.classList.toggle('show');
    }

    hideDropdown() {
        this.dropdown.classList.remove('show');
    }

    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.badge.textContent = unreadCount;
        this.badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    // Simulated notification loading (replace with actual API call)
	async loadNotifications() {
        try {
            const user_id = sessionStorage.getItem("userId");
            const response = await fetch('notifications?userId='+user_id, {
                method: 'GET',
                credentials: 'same-origin' // Include cookies if using session auth
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const notifications = await response.json();
            this.notifications = notifications.map(n => ({
                id: n.id,
                title: n.caption, // Using caption as title
				type: n.type,
                time: n.created_at,     // Using type as time (you might want to add timestamp to DB)
                read: n.read
            }));

            this.renderNotifications();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    renderNotifications() {
        this.dropdown.innerHTML = '';
        this.notifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-item ${notification.read ? '' : 'unread'}`;
            item.innerHTML = `
                <div class="title">${notification.title}</div>
                <div class="time">${notification.time}</div>
            `;
            item.addEventListener('click', () => this.markAsRead(notification.id));
            this.dropdown.appendChild(item);
        });
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.renderNotifications();
        }
    }

    // Method to add new notification (could be called from WebSocket or API)
    addNotification(title, time) {
        const newNotification = {
            id: Date.now(), // Simple ID generation
            title,
            time,
            read: false
        };
        this.notifications.unshift(newNotification);
        this.renderNotifications();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});