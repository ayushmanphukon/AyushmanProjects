class FriendsView {
    constructor() {
        this.mainContent = document.querySelector('.main-content');
        this.friendsType = 'followers';
        this.currentUserProfilePic = 'images/default-profile.jpg';
        this.initialize();
    }

    async initialize() {
        await this.loadCurrentUserProfilePic();
		this.disableScroll();
        this.loadFriends();
    }
	
	disableScroll() {
	    window.onscroll = null;
		const scrollTopBtn = document.getElementById("scrollTopBtn");
		if(scrollTopBtn){
			scrollTopBtn.style.display = "none";
		}
		console.log("scroll disabled");
	}
	
	

	async loadCurrentUserProfilePic() {
	        this.currentUserProfilePic = await this.getCurrentUserProfilePic();
	        console.log('Initialized profile pic:', this.currentUserProfilePic);
	    }

    async getCurrentUserProfilePic() {
        try {
            const response = await fetch('api/profile/get');
            if (response.status === 401) {
                window.location.href = 'login.html';
                return 'images/default-profile.jpg';
            }
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch profile');
            }
            const data = await response.json();
            console.log('Fetched profilePictureUrl:', data.profilePictureUrl);
            return data.profilePictureUrl || 'images/default-profile.jpg';
        } catch (error) {
            console.error('Error loading profile:', error);
            return 'images/default-profile.jpg';
        }
    }
	

    async loadFriends() {
        try {
            const response = await fetch(`FriendsServlet?type=${this.friendsType}&userId=${document.body.dataset.userId}`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const friends = await response.json();
			console.log("friends:");
			console.log(friends);
            this.renderFriends(friends);
        } catch (error) {
            console.error('Error loading friends:', error);
            this.mainContent.innerHTML = '<p>Error loading friends. Please try again later.</p>';
        }
    }

    renderFriends(friends) {
		const friendsHtml = `
		            <div class="friends-container">
		                <div class="tabs">
		                    <button class="tab ${this.friendsType === 'followers' ? 'active' : ''}" id="followersButton">Followers</button>
		                    <button class="tab ${this.friendsType === 'following' ? 'active' : ''}" id="followingsButton">Following</button>
		                    <button class="tab ${this.friendsType === 'mutual' ? 'active' : ''}" id="mutualButton">Mutual</button>
		                </div>
		                <div class="tab-content">
							${friends.length ? `${friends.map(friend => this.renderFriendCard(friend)).join('')}` : `<span>No ${this.friendsType}</span>`}
		                    
		                </div>
		            </div>
		        `;

        this.mainContent.innerHTML = friendsHtml;
		
        const buttons = {
            followers: document.getElementById('followersButton'),
            following: document.getElementById('followingsButton'),
            mutual: document.getElementById('mutualButton')
        };

        buttons.followers.addEventListener('click', () => this.switchFriends('followers', buttons));
        buttons.following.addEventListener('click', () => this.switchFriends('following', buttons));
        buttons.mutual.addEventListener('click', () => this.switchFriends('mutual', buttons));

        document.querySelectorAll(".friend-card").forEach(card => {
            const profile = card.querySelector(".avatar");
            profile.addEventListener("click", () => {
                const userId = card.dataset.userId;
                if (window.userProfileView) {
                    window.userProfileView.loadUserProfile(userId);
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
                    <span class="username">${friend.username}</span>
					<button class="follow-button" onclick="window.userProfileView.handleFollow(${friend.user_id}, ${currentUserId})"
					 style="background-color: ${friend.is_following ? 'var(--bg-dark)' : ''}; color:${friend.is_following ? 'black':''}"
					 id="follow-button-${friend.user_id}">${friend.is_following ? 'Following' : 'Follow'}</button>
                </div>
                <button class="chat-button" onclick="alert('Chat with ${friend.username}')">
                    <svg class="chat-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                </button>
            </li>
        `;
    }

	switchFriends(type, buttons) {
	        this.friendsType = type;

	        // Remove 'active' class from all buttons
	        Object.values(buttons).forEach(btn => btn.classList.remove('active'));

	        // Add 'active' class to the selected button
	        buttons[type].classList.add('active');

	        this.loadFriends();
	    }
}