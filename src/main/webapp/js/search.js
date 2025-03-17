class SearchHandler {

	
    constructor() {
        console.log('Initializing SearchHandler');  // Debug log
        this.searchContainer = document.querySelector('.search-container');
        this.searchInput = document.querySelector('.search-input');
        this.searchResults = document.querySelector('.search-results');

        console.log('Search elements:', {  // Debug log
            container: this.searchContainer,
            input: this.searchInput,
            results: this.searchResults
        });

        if (!this.searchInput || !this.searchResults) {
            console.error('Search elements not found:', {
                input: this.searchInput,
                results: this.searchResults
            });
            return;
        }

        this.initialize();
    }

    initialize() {
        console.log('Adding event listeners');  // Debug log
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            console.log('Search input:', query); // Debug log

            if (query.length === 0) {
                this.hideResults();
                return;
            }

            if (query.length >= 1) {
                this.performSearch(query);
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchContainer.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    async performSearch(query) {
        try {
            console.log('Performing search for:', query);
            this.searchResults.innerHTML = '<div class="loading">Searching...</div>';
            this.searchResults.style.display = 'block';

            const response = await fetch(`api/search?q=${encodeURIComponent(query)}`);
            console.log('Response:', response);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Search results:', data);
            this.displayResults(data.users);
        } catch (error) {
            console.error('Search error:', error);
            this.displayError();
        }
    }

    displayResults(users) {
        console.log('Displaying results:', users);  // Debug log
        if (!users || users.length === 0) {
            this.searchResults.innerHTML = `
                <div class="no-results">No users found</div>
            `;
        } else {
            this.searchResults.innerHTML = users.map(user => `
                <div class="search-result-item" data-user-id="${user.userId}">
                    <img src="${user.profilePictureUrl || 'images/default-profile.jpg'}"
                         alt="${user.username}"
                         class="search-result-avatar">
                    <div class="search-result-info">
                        <div class="search-result-username">${user.username}</div>
                        <div class="search-result-fullname">${user.fullName || ''}</div>
                    </div>
                </div>
            `).join('');

            // Add click handlers
            this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const userId = item.dataset.userId;
                    console.log('User clicked:', userId);
                    if (window.userProfileView) {
                        window.userProfileView.loadUserProfile(userId, "yourPostsTab");
                        this.hideResults();
                    } else {
                        console.error('UserProfileView not initialized');
                    }
                });
            });
        }
        this.searchResults.style.display = 'block';
    }

    displayError() {
        this.searchResults.innerHTML = `
            <div class="error">Failed to perform search. Please try again.</div>
        `;
        this.searchResults.style.display = 'block';
    }

    hideResults() {
        if (this.searchResults) {
            this.searchResults.style.display = 'none';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.userProfileView) {
        console.warn('UserProfileView not initialized, initializing now...');
        window.userProfileView = new UserProfileView();
    }
    window.searchHandler = new SearchHandler();
});