class UserProfileView {
    constructor() {
        this.mainContent = document.querySelector('.main-content');
        this.currentUserProfilePic = 'images/default-profile.jpg';
        this.currentPostsTab = "posts";
        this.initialize();
    }

    async initialize() {
        await this.loadCurrentUserProfilePic();
    }
	
	messageIconListener() {
	    const chatIcon = document.getElementById("user-chat-button");
	    const navItems = document.querySelectorAll(".nav-item");

	    if (!chatIcon) {
	        console.error("Chat button not found");
	        return;
	    }

	    chatIcon.addEventListener("click", () => {
	        console.log("Chat icon clicked");
	        navItems.forEach(item => item.classList.remove("active"));
	        
	        navItems.forEach(item => {
	            const span = item.querySelector("span");
	            if (span && span.innerText === "Messages") {
	                console.log("Activating Messages nav item");
	                item.classList.add("active");
	            }
	        });
	    });
	}

    disableScroll() {
        window.onscroll = null;
        const scrollTopBtn = document.getElementById("scrollTopBtn");
        if (scrollTopBtn) {
            scrollTopBtn.style.display = "none";
        }
        console.log("scroll disabled");
    }

    async loadCurrentUserProfilePic() {
        this.currentUserProfilePic = await this.getCurrentUserProfilePic();
        console.log('Initialized profile pic:', this.currentUserProfilePic);
        console.log("currentUser:" + sessionStorage.getItem("userId"));
    }

    async getCurrentUserProfilePic() {
        try {
            const response = await fetch('api/profile/get', { credentials: 'include' });
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
            this.showNotification('Failed to load profile', 'error');
            return 'images/default-profile.jpg';
        }
    }

	async loadUserProfile(userId, kind = 'yourPostsTab') {
	    this.disableScroll();
	    const currentUserId = sessionStorage.getItem("userId");
	    if (!currentUserId) {
	        window.location.href = 'login.html';
	        return;
	    }

	    try {
	        const response = await fetch(`UserProfileServlet?userId=${userId}&currentUserId=${currentUserId}`, {
	            method: "GET",
	            credentials: 'include'
	        });
	        if (!response.ok) {
	            throw new Error(`HTTP error! status: ${response.status}`);
	        }
	        const profileData = await response.json();

	        const response2 = await fetch(`api/feeds?kind=${kind}&currentUserId=${currentUserId}&userId=${userId}&limit=20&offset=0`, {
	            credentials: 'include'
	        });
	        if (!response2.ok) {
	            const errorText = await response2.text();
	            throw new Error(`HTTP error fetching posts! status: ${response2.status} - ${errorText}`);
	        }
	        const profilePosts = await response2.json();
	        console.log("Profile posts:", profilePosts);

	        this.renderUserProfile(profileData, userId, false, profilePosts);
	    } catch (error) {
	        console.error('Error loading user profile:', error);
	        this.showError('Failed to load user profile. Please try again.');
	    }
		
		new Nav().messageIconListener();
	}

	async loadCurrentUserProfile(kind = 'yourPostsTab') {
	    this.disableScroll();
	    const userId = sessionStorage.getItem("userId");
	    if (!userId) {
	        window.location.href = 'login.html';
	        return;
	    }

	    try {
	        const response = await fetch(`UserProfileServlet?userId=${userId}&currentUserId=${userId}`, {
	            method: "GET",
	            credentials: 'include'
	        });
	        if (response.status === 401) {
	            window.location.href = 'login.html';
	            return;
	        }
	        if (!response.ok) {
	            throw new Error(`HTTP error! status: ${response.status}`);
	        }
	        const profileData = await response.json();

	        const response2 = await fetch(`api/feeds?kind=${kind}&currentUserId=${userId}&userId=${userId}&limit=20&offset=0`, {
	            credentials: 'include'
	        });
	        if (!response2.ok) {
	            const errorText = await response2.text();
	            throw new Error(`HTTP error fetching posts! status: ${response2.status} - ${errorText}`);
	        }
	        const profilePosts = await response2.json();
	        console.log("Current user posts:", profilePosts);

	        this.renderUserProfile(profileData, userId, true, profilePosts);
	    } catch (error) {
	        console.error('Error loading current user profile:', error);
	        this.showError('Failed to load user profile. Please try again.');
	    }
	}

    renderUserProfile(profile, userId, isCurrentUser, posts) {
        console.log('Rendering profile:', profile);
        const createdDate = new Date(profile.createdAt).toLocaleDateString();
        const currentUserId = sessionStorage.getItem("userId");

        const profileHtml = `
            <div class="user-profile-container" data-user-id="${userId}">
                
                <div class="user-profile-header">
				
                    <img src="${profile.profilePictureUrl || 'images/default-profile.jpg'}" 
                         alt="${profile.username}" 
                         class="user-profile-picture">
                    <div class="user-profile-info">
                        <div class="user-profile-name">
                            <div>
                                <div class="user-profile-username">${profile.username}</div>
                                <div class="user-profile-fullname">${profile.fullName || ''}</div>
                            </div>
                            ${currentUserId == userId ? `
                                <div class="user-profile-options">
                                    <a href="#" class="user-profile-buttons" id="user-profile-options-edit" onclick="window.profileManager.openModal()">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <a href="#" class="user-profile-buttons signOut" id="user-profile-options-edit" onclick="window.userProfileView.signOut()">
                                        <i class="fas fa-sign-out-alt"></i>
                                    </a>
                                </div>
                            ` : `
                                <a href="#" class="user-profile-buttons" id="user-chat-button" onclick="new Messages().newMessage(${userId})">
                                    <i class="fas fa-comment-alt"></i>
                                </a>
                            `}
                        </div>
                        <div class="user-profile-stats">
                            <div class="stat-block">
                                <div class="stat-number postsCount">${profile.posts_count}</div>
                                <div class="stat-label">Posts</div>
                            </div>
                            <div class="stat-block">
                                <div class="stat-number followersCount">${profile.followers}</div>
                                <div class="stat-label">Followers</div>
                            </div>
                            <div class="stat-block">
                                <div class="stat-number followingsCount">${profile.followings}</div>
                                <div class="stat-label">Following</div>
                            </div>
                        </div>
                        <div class="user-profile-bio">${profile.bio || 'No bio yet'}</div>
                        <div class="user-profile-meta">Joined ${createdDate}</div>
                        <div class="user-profile-actions">
                            <button class="follow-button ${userId == currentUserId ? 'active' : ''}" 
                                    onclick="window.userProfileView.handleFollow(${userId}, '${currentUserId}')"
                                    id="follow-button-${userId}">
                                ${profile.isFollowed ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    </div>
					${isCurrentUser ? "" : "<div class='close-profile' onclick='window.userProfileView.closeProfile()'><i class='fas fa-times'></i></div>"}
                </div>
                <div class="posts-section">
                    <div class="posts-section-options">
                        <div class="posts-header ${this.currentPostsTab === 'posts' ? 'active' : ''}" 
                             onclick="window.userProfileView.switchCurrentPostsTab('posts', 'yourPostsTab')">Posts</div>
                        ${currentUserId == userId ? `
                            <div class="posts-header ${this.currentPostsTab === 'liked' ? 'active' : ''}" 
                                 onclick="window.userProfileView.switchCurrentPostsTab('liked', 'yourLikedPostsTab')">Liked</div>
                        ` : ''}
                    </div>
                    <div class="posts">
                        ${posts.length > 0 ? posts.map(post => window.feedsView.renderFeedCard(post)).join('') : `
                            <div class="no-posts-message">
                                <i class="fas fa-camera"></i>
                                <p>No ${this.currentPostsTab === 'liked' ? 'liked ' : ''}posts yet</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        this.mainContent.innerHTML = profileHtml;

        const postsSectionOptions = document.querySelectorAll(".posts-header");
        postsSectionOptions.forEach(option => {
            option.addEventListener("click", (event) => {
                postsSectionOptions.forEach(item => item.classList.remove("active"));
                event.currentTarget.classList.add("active");
            });
        });

        const followBtn = document.querySelector(".follow-button");
        if (profile.isFollowed) {
            followBtn.style.backgroundColor = "var(--bg-dark)";
			followBtn.style.color = "black";
        }
    }

    switchCurrentPostsTab(currentPostsTab, kind) {
        this.currentPostsTab = currentPostsTab;
        this.loadCurrentUserProfile(kind);
    }

    closeProfile() {
        const currentTab = document.querySelector(".nav-item.active");
        const tabSpan = currentTab?.querySelector("span");
        if (tabSpan) {
            const currentTabText = tabSpan.innerText;
            if (currentTabText === "Feeds") {
                new FeedsView();
            } else if (currentTabText === "Friends") {
                new FriendsView();
            } else if (currentTabText === "Profile") {
                new UserProfileView().loadCurrentUserProfile("yourPostsTab");
            } else if (currentTabText === "Messages") {
                new Messages().displayReceivedMessages(); // Fixed typo
            }
        }
    }

    signOut() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    showError(message) {
        this.mainContent.innerHTML = `<div class="error-message">${message}</div>`;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.querySelector('.notification-container')?.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

	handleFollow(followingUserId, currentUserId) {
	    const followBtn = document.getElementById(`follow-button-${followingUserId}`);
	    if (followBtn) {
	        if (!currentUserId) {
	            this.showNotification("Please log in to follow users", "error");
	            window.location.href = 'login.html';
	            return;
	        }

	        const isFollowed = followBtn.innerText === "Following";
	        console.log('Following User ID:', followingUserId);
	        console.log('Current User ID:', currentUserId);
	        const url = `FollowServlet?followingUserId=${followingUserId}&currentUserId=${currentUserId}&isFollowed=${isFollowed}`;
	        console.log('Sending follow request:', url);

	        fetch(url, {
	            method: "GET",
	            credentials: 'include'
	        })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text().then(text => {
                    console.log('Raw response:', text);
                    try {
                        return text ? JSON.parse(text) : { success: false, error: 'Empty response' };
                    } catch (e) {
                        throw new Error('Invalid JSON: ' + text);
                    }
                });
            })
            .then(data => {
                console.log('Parsed follow response:', data);
                if (data.success) {
                    if (!isFollowed) {
                        followBtn.innerText = "Following";
                        followBtn.style.backgroundColor = "var(--bg-dark)";
						followBtn.style.color = "black";
                        this.showNotification("Successfully followed!", "success");
                    } else {
                        followBtn.innerText = "Follow";
                        followBtn.style.backgroundColor = "var(--accent-color)";
						followBtn.style.color = "white";
                        this.showNotification("Successfully unfollowed!", "success");
                    }
                } else {
                    console.error('Follow action failed:', data.error || 'Unknown error');
                    this.showNotification(`Failed to ${isFollowed ? 'unfollow' : 'follow'}: ${data.error || 'Unknown error'}`, 'error');
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                this.showNotification(`Error: ${error.message}`, 'error');
            });
        } else {
            console.log("Follow button doesn’t exist!");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.userProfileView = new UserProfileView();
});