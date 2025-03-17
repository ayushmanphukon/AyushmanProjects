class Suggestions {
    constructor() {
        this.suggestionsDiv = document.querySelector(".suggestions");
        this.initialize();
    }
    
    initialize() {
        this.loadSuggestions();

    }
    
    async loadSuggestions() {
        const currentUserId = sessionStorage.getItem("userId");
        try {
            const response = await fetch(`GetSuggestionsServlet?currentUserId=${currentUserId}`);
            const suggestions = await response.json();

            this.suggestionsDiv.innerHTML = suggestions.map(friend => 
                this.renderFriendCard(friend)
            ).join('');
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
		
		const friendInfo = document.querySelectorAll(".friend-card");
		
		friendInfo.forEach(friend => {
		                friend.addEventListener("click", (e) => {
		                    // Get the userId from the closest friend-card's data attribute
		                    const friendCard = e.currentTarget.closest(".friend-card");
		                    const userId = friendCard.getAttribute("data-user-id");
		                    
		                    // Check if userProfileView exists and call loadUserProfile
		                    if (window.userProfileView) {
		                        window.userProfileView.loadUserProfile(userId, "yourPostsTab");
		                    }
		                });
		            });
    }
    
    renderFriendCard(friend) {
        const currentUserId = sessionStorage.getItem("userId");
        return `
            <li data-user-id="${friend.user_id}" class="friend-card">
                <div class="friend-info">
                    <img src="${friend.profile_picture_url || 'images/default-profile.jpg'}" 
                         alt="${friend.username}'s avatar" 
                         class="avatar"
                         onerror="this.src='images/default-profile.jpg'">
                    <span class="username suggested" >${friend.username}</span>
                </div>
            </li>
        `;
    }
}

window.suggestions = new Suggestions();

