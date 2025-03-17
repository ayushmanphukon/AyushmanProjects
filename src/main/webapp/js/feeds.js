class FeedsView {
    constructor() {
        this.mainContent = document.querySelector('.main-content');
        this.feedType = 'suggestions'; // Default feed type
        this.currentUserProfilePic = 'images/default-profile.jpg';
        this.limit = 20;
        this.offset = 0;
        if (!window.feedsWebsocket) {
            window.feedsWebsocket = new FeedsWebSocket();
        }
        this.initialize();
    }

    async initialize() {
        await this.loadCurrentUserProfilePic();
        this.initializeFeedsTab();
        this.loadFeeds("suggestions"); // Initial load with valid kind
        this.initializePostOptions();
        this.initializeCommentOptions();
        this.initializeScrollButton();
    }

    initializeScrollButton() {
        const scrollTopBtn = document.getElementById("scrollTopBtn");
        setTimeout(() => scrollTopBtn.classList.remove("shake"), 500);
        window.onscroll = () => {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                scrollTopBtn.style.display = "block";
            } else {
                scrollTopBtn.style.display = "none";
            }

            if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
                const kind = this.feedType === 'suggestions' ? 'suggestions' : 'feedsTab';
                this.loadFeeds(kind);
            }
        };

        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    initializeFeedsTab() {
        const feedsHtml = `
            <div class="feeds-section">
                <div class="feeds-header">
                    <div class="feeds-header-content">
                        <h1 class="feeds-title">Feeds</h1>
                        <div class="header-actions">
                            <div class="feed-tabs">
                                <button class="tab" id="SuggestionsButton" style="color: ${this.feedType === 'suggestions' ? 'var(--text-primary)' : 'var(--text-secondary)'}">Suggestions</button>
                                <button class="tab" id="RecentButton" style="color: ${this.feedType === 'recent' ? 'var(--text-primary)' : 'var(--text-secondary)'}">Recent</button>
                                <button class="tab" id="FriendsButton" style="color: ${this.feedType === 'friends' ? 'var(--text-primary)' : 'var(--text-secondary)'}">Friends</button>
                            </div>
                            <button class="create-post-btn">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="feeds-content"></div>
            </div>
        `;
        
        this.mainContent.innerHTML = feedsHtml;

        const recentButton = document.getElementById('RecentButton');
        const friendsButton = document.getElementById('FriendsButton');
        const suggestionsButton = document.getElementById('SuggestionsButton');

        recentButton.addEventListener('click', () => {
            recentButton.style.color = 'var(--text-primary)';
            friendsButton.style.color = 'var(--text-secondary)';
            suggestionsButton.style.color = 'var(--text-secondary)';
            this.switchFeed('recent');
        });

        friendsButton.addEventListener('click', () => {
            recentButton.style.color = 'var(--text-secondary)';
            friendsButton.style.color = 'var(--text-primary)';
            suggestionsButton.style.color = 'var(--text-secondary)';
            this.switchFeed('friends');
        });

        suggestionsButton.addEventListener('click', () => {
            recentButton.style.color = 'var(--text-secondary)';
            friendsButton.style.color = 'var(--text-secondary)';
            suggestionsButton.style.color = 'var(--text-primary)';
            this.switchFeed('suggestions');
        });
    }

    async loadCurrentUserProfilePic() {
        this.currentUserProfilePic = await this.getCurrentUserProfilePic();
        console.log('Initialized profile pic:', this.currentUserProfilePic);
        console.log("currentUser:" + sessionStorage.getItem("userId"));
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
            this.showNotification('Failed to load profile', 'error');
            return 'images/default-profile.jpg';
        }
    }

    initializePostOptions() {
        let activeMenu = null;

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.post-options')) {
                if (activeMenu) {
                    activeMenu.classList.remove('active');
                    activeMenu = null;
                }
                return;
            }

            const optionsBtn = e.target.closest('.options-btn');
            if (optionsBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const menu = optionsBtn.nextElementSibling;
                
                if (menu === activeMenu) {
                    menu.classList.remove('active');
                    activeMenu = null;
                } else {
                    if (activeMenu) {
                        activeMenu.classList.remove('active');
                    }
                    menu.classList.add('active');
                    activeMenu = menu;
                }
            }

            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                e.preventDefault();
                e.stopPropagation();
                
                const postCard = menuItem.closest('.feed-card');
                const postId = postCard.dataset.postId;
                const menu = menuItem.closest('.options-menu');

                if (menuItem.classList.contains('edit-post')) {
                    this.getPostData(postId).then(postData => {
                        window.postEditor.openModal(postData);
                    });
                } else if (menuItem.classList.contains('delete-post')) {
                    this.deletePost(postId);
                } else if (menuItem.classList.contains('report-post')) {
                    alert('Post reported successfully!');
                }

                menu.classList.remove('active');
                activeMenu = null;
            }
        });
    }

    initializeCommentOptions() {
        let activeMenu = null;

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.comment-options')) {
                if (activeMenu) {
                    activeMenu.classList.remove('active');
                    activeMenu = null;
                }
                return;
            }

            const optionsBtn = e.target.closest('.comment-options .options-btn');
            if (optionsBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const menu = optionsBtn.nextElementSibling;
                
                if (menu === activeMenu) {
                    menu.classList.remove('active');
                    activeMenu = null;
                } else {
                    if (activeMenu) {
                        activeMenu.classList.remove('active');
                    }
                    menu.classList.add('active');
                    activeMenu = menu;
                }
            }

            const menuItem = e.target.closest('.comment-options .menu-item');
            if (menuItem) {
                e.preventDefault();
                e.stopPropagation();
                
                const feedCard = menuItem.closest('.feed-card');
                const postId = feedCard.dataset.postId;
                const commentCard = menuItem.closest('.comment-card');
                const commentId = commentCard.dataset.commentId;
                const menu = menuItem.closest('.options-menu');

                if (menuItem.classList.contains('edit-comment')) {
                    this.editComment(commentId);
                } else if (menuItem.classList.contains('delete-comment')) {
                    this.deleteComment(commentId, postId);
                } else if (menuItem.classList.contains('report-comment')) {
                    alert('Comment reported successfully!');
                }

                menu.classList.remove('active');
                activeMenu = null;
            }
        });
    }

    async getPostData(postId) {
        const response = await fetch(`api/posts/${postId}`);
        if (!response.ok) throw new Error('Failed to fetch post data');
        return await response.json();
    }

    async deletePost(postId) {
        try {
            const confirmed = await this.showDeleteConfirmation();
            if (!confirmed) return;

            const response = await fetch(`api/posts/delete/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                const postCard = document.querySelector(`.feed-card[data-post-id="${postId}"]`);
                if (postCard) {
                    postCard.remove();
                    this.showNotification('Post deleted successfully', 'success');
                }
                
                const modals = document.querySelectorAll('.delete-confirm-modal');
                modals.forEach(modal => modal.remove());

                window.feedsWebsocket.notifyPostDelete(postId);
            } else {
                this.showNotification(result.error || 'Failed to delete post', 'error');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showNotification('Failed to delete post', 'error');
            
            const modals = document.querySelectorAll('.delete-confirm-modal');
            modals.forEach(modal => modal.remove());
        }
    }

    showDeleteConfirmation() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal delete-confirm-modal';
            modal.innerHTML = `
                <div class="modal-content" role="dialog" aria-labelledby="delete-modal-title">
                    <div class="modal-header">
                        <h2 id="delete-modal-title">Delete Post</h2>
                        <span class="close" aria-label="Close">X</span>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this post? This action cannot be undone.</p>
                        <div class="button-group">
                            <button class="cancel-btn" aria-label="Cancel">Cancel</button>
                            <button class="delete-btn" aria-label="Confirm Delete">Delete</button>
                        </div>
                    </div>
                </div>
            `;
            
            const existingModal = document.querySelector('.delete-confirm-modal');
            if (existingModal) existingModal.remove();

            document.body.appendChild(modal);
            modal.style.display = 'block';

            const handleClose = (shouldDelete) => {
                modal.remove();
                resolve(shouldDelete);
            };

            const closeBtn = modal.querySelector('.close');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const deleteBtn = modal.querySelector('.delete-btn');

            closeBtn.onclick = () => handleClose(false);
            cancelBtn.onclick = () => handleClose(false);
            deleteBtn.onclick = () => handleClose(true);

            modal.onclick = (e) => {
                if (e.target === modal) handleClose(false);
            };

            modal.focus();
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') handleClose(false);
                if (e.key === 'Enter' && document.activeElement === deleteBtn) handleClose(true);
            });
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.querySelector('.notification-container').appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    async loadFeeds(kind) {
        const userId = sessionStorage.getItem('userId');
        const validKinds = ['feedsTab', 'recent', 'yourPostsTab', 'yourLikedPostsTab', 'suggestions'];
        if (!validKinds.includes(kind)) {
            console.error(`Invalid kind parameter: ${kind}. Defaulting to 'feedsTab'`);
            kind = 'feedsTab';
        }

        try {
            const url = `api/feeds?type=${this.feedType}&kind=${kind}&userId=${userId}&currentUserId=${userId}&limit=${this.limit}&offset=${this.offset}`;
            console.log('Fetching feeds from:', url);
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = 'login.html';
                    return;
                }
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const feeds = await response.json();
            console.log('Feeds loaded:', feeds);
            this.renderFeeds(feeds);
            this.offset += this.limit;
        } catch (error) {
            console.error('Error loading feeds:', error);
            this.showError('Failed to load feeds. Please try again later.');
        }
    }

    renderFeeds(feeds) {
        const feedsHtml = feeds.map(feed => this.renderFeedCard(feed)).join('');
        const feedsContent = document.querySelector('.feeds-content');
        feedsContent.innerHTML += feedsHtml;

        window.feeds = document.querySelector(".feeds-content");
        window.feeds.querySelectorAll(".feed-card").forEach(feed => {
            const profile = feed.querySelector(".user-avatar");
            profile.addEventListener("click", () => {
                const userId = feed.dataset.userId;
                console.log('User clicked:', userId);
                if (window.userProfileView) {
                    window.userProfileView.loadUserProfile(userId, "yourPostsTab");
                } else {
                    console.error('UserProfileView not initialized');
                }
            });
        });
    }

    renderFeedCard(feed) {
        const currentUserId = sessionStorage.getItem("userId");
        return `
            <div class="feed-card" data-post-id="${feed.postId}" data-user-id="${feed.userId}">
                <div class="card-header">
                    <div class="user-info" data-user-id="${feed.userId}">
                        <img src="${feed.profilePic || 'images/default-profile.jpg'}" 
                             alt="${feed.username}" 
                             class="user-avatar">
                        <div class="user-details">
                            <div class="user-name-row">
                                <span class="username">${feed.username}</span>
                            </div>
                            <span class="time" data-timestamp="${feed.createdAt}">${this.formatTimeAgo(feed.createdAt)}</span>
                        </div>
                    </div>
                    <div class="post-options">
                        <button type="button" class="options-btn">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="options-menu">
                            ${currentUserId == feed.userId ? `
                                <button type="button" class="menu-item edit-post">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button type="button" class="menu-item delete-post">
                                    <i class="fas fa-trash-alt"></i> Delete
                                </button>
                            ` : `
                                <button type="button" class="menu-item report-post">
                                    <i class="fas fa-flag"></i> Report
                                </button>
                            `}
                        </div>
                    </div>
                </div>
                <div class="card-content">
                    <div class="content-text">${feed.caption}</div>
                    ${feed.imageUrl ? `
                        <div class="feed-media">
                            <img src="${feed.imageUrl}" alt="Post content" class="post-image">
                        </div>
                    ` : ''}
                </div>
                <div class="card-actions">
                    <div class="action-group">
                        <button class="action-btn ${feed.isLiked ? 'active' : ''}" 
                                onclick="window.feedsView.handleLike(${feed.postId}, ${feed.userId})">
                            <i class="fa${feed.isLiked ? 's' : 'r'} fa-heart"></i>
                            <span>${this.formatCount(feed.likesCount)}</span>
                        </button>
                        <button class="action-btn" onclick="window.feedsView.handleComments(${feed.postId})" id="comment-btn-${feed.postId}">
                            <i class="far fa-comment"></i>
                            <span id="commentsCount-${feed.postId}">${feed.commentsCount}</span>
                        </button>
                        <button class="action-btn">
                            <i class="far fa-paper-plane"></i>
                        </button>
                    </div>
                    <button class="action-btn">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
                <div class="comment-section" id="comment-section-${feed.postId}">
                    <div class="comments-container">
                        <div class="comments-list" id="comment-list-${feed.postId}"></div>
                        <div class="comment-form">
                            <img src="${this.currentUserProfilePic}" 
                                 alt="Profile" 
                                 class="user-avatar"
                                 onerror="this.src='images/default-profile.jpg'">
                            <div class="comment-input-wrapper">
                                <input type="text" 
                                       class="comment-input" 
                                       placeholder="Add a comment..."
                                       maxlength="1000"
                                       id="comment-input-${feed.postId}">
                                <button onclick="window.feedsView.postComment(${feed.postId})" id="post-comment-btn-${feed.postId}" class="post-comment-btn" disabled>Post</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCommentCard(comment) {
        return `
            <div class="comment-card" data-comment-id="${comment.comment_id}" data-user-id="${comment.user_id}">
                <div class="comment-header">
                    <div class="user-info">
                        <img src="${comment.profile_pic || 'images/default-profile.jpg'}" alt="${comment.username}" class="user-avatar">
                        <div class="comment-user-details">
                            <span class="username">${comment.username}</span>
                            <span class="time" data-timestamp="${comment.created_at}">${this.formatTimeAgo(comment.created_at)}</span>
                        </div>
                    </div>
                    <div class="comment-options">
                        <button type="button" class="options-btn">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="options-menu">
                            ${this.getCurrentUserId() === Number(comment.user_id) ? `
                                <button type="button" class="menu-item edit-comment">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button type="button" class="menu-item delete-comment">
                                    <i class="fas fa-trash-alt"></i> Delete
                                </button>
                            ` : `
                                <button type="button" class="menu-item report-comment">
                                    <i class="fas fa-flag"></i> Report
                                </button>
                            `}
                        </div>
                    </div>
                </div>
                <div class="comment-content">${comment.comment}</div>
                <div class="comment-actions">
                    <button class="action-btn like-comment ${comment.isLiked ? 'active' : ''}" 
                            onclick="window.feedsView.handleLikeComment(${comment.comment_id}, ${comment.user_id})">
                        <i class="fa${comment.isLiked ? 's' : 'r'} fa-heart"></i>
                        <span>${this.formatCount(comment.likes_count)}</span>
                    </button>
                    <button class="action-btn reply-comment" onclick="window.feedsView.handleReply(${comment.comment_id})">
                        <i class="far fa-reply"></i>
                    </button>
                </div>
            </div>
        `;
    }

    handleComments(postId) {
        const commentSection = document.getElementById("comment-section-" + postId);
        const currentDisplay = window.getComputedStyle(commentSection).display;
        const userId = sessionStorage.getItem("userId");
        if (currentDisplay === "none") {
            commentSection.style.display = "block";
            
            fetch('FetchCommentServlet?postId=' + postId + '&userId=' + userId, { method: "Get" })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    console.log(data);
                    this.displayComments(data, postId);
                })
                .catch(error => console.error('Fetch error:', error));

            const commentInput = document.getElementById("comment-input-" + postId);
            const postComment = document.getElementById("post-comment-btn-" + postId);

            commentInput.addEventListener("input", () => {
                const comment = commentInput.value.trim();
                postComment.disabled = comment.length === 0;
            });
        } else {
            commentSection.style.display = "none";
        }
    }

    deleteComment(commentId, postId) {
        const userId = sessionStorage.getItem("userId");
        fetch('DeleteCommentServlet?commentId=' + commentId + '&userId=' + userId + '&postId=' + postId, { method: "Get" })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log("HIII: " + data);
                    console.log("comment deleted id:" + commentId);
                }
            })
            .catch(error => console.error('Fetch error:', error));
    }

    displayComments(data, postId) {
        const commentList = document.getElementById("comment-list-" + postId);
        commentList.innerHTML = "";
        data.forEach(comment => {
            if (commentList) {
                const commentHtml = this.renderCommentCard(comment);
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = commentHtml;
                commentList.append(tempDiv);
            } else {
                console.log("could not append!");
            }
        });

        window.comments = document.querySelector(".comments-list");
        window.comments.querySelectorAll(".comment-card").forEach(comment => {
            const profile = comment.querySelector(".user-avatar");
            profile.addEventListener("click", () => {
                const userId = comment.dataset.userId;
                console.log('User clicked:', userId);
                if (window.userProfileView) {
                    window.userProfileView.loadUserProfile(userId);
                } else {
                    console.error('UserProfileView not initialized');
                }
            });
        });
    }

    postComment(postId) {
        const userId = sessionStorage.getItem("userId");
        const commentInputField = document.getElementById("comment-input-" + postId);
        const commentInput = commentInputField.value;
        const postComment = document.getElementById("post-comment-btn-" + postId);
        fetch('PostCommentServlet?postId=' + postId + '&userId=' + userId + '&comment=' + commentInput, { method: "Post" })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log('Comment posted:', data.data);
                    return fetch('FetchCommentServlet?postId=' + postId + '&userId=' + userId, { method: "Get" });
                } else {
                    console.error('Error from server:', data.message);
                }
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                console.log(data);
                this.displayComments(data, postId);
                setTimeout(() => {
                    commentInputField.value = "";
                    postComment.disabled = true;
                }, 30);
            })
            .catch(error => console.error('Fetch error:', error));
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }

    formatCount(count) {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
    }

    switchFeed(type) {
        this.feedType = type;
        this.offset = 0;
        const feedsContent = document.querySelector(".feeds-content");
        feedsContent.innerHTML = "";
        const kind = type === 'suggestions' ? 'suggestions' : 'feedsTab';
        this.loadFeeds(kind);
    }

    showError(message) {
        this.mainContent.innerHTML = `<div class="error-message">${message}</div>`;
    }

    getCurrentUserId() {
        const userId = document.body.getAttribute('data-user-id');
        if (!userId) {
            console.error('No user ID found in HTML');
            return null;
        }
        return Number(userId);
    }

    handleLike(postId) {
        const userId = sessionStorage.getItem("userId");
        fetch('LikeServlet?postId=' + postId + '&userId=' + userId, { method: "Post" })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Liked! post:" + postId);
                }
            });
    }

    // Placeholder methods since they weren't fully implemented in the original
    editComment(commentId) {
        console.log('Edit comment:', commentId); // Implement as needed
    }

    handleLikeComment(commentId, userId) {
        console.log('Like comment:', commentId, 'by user:', userId); // Implement as needed
    }

    handleReply(commentId) {
        console.log('Reply to comment:', commentId); // Implement as needed
    }
}

class PostUploader {
    constructor() {
        this.modal = document.getElementById('create-post-modal');
        this.form = document.getElementById('create-post-form');
        this.mediaPreview = document.getElementById('media-preview');
        this.mediaInput = document.getElementById('post-media');
        this.editor = document.getElementById('post-caption');
        this.captionInput = document.getElementById('caption-input');
        this.initialize();
        this.initializeMediaPreview();
    }

    initialize() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.create-post-btn')) {
                this.editor.innerHTML = '';
                this.mediaPreview.innerHTML = '';
                this.mediaInput.value = '';
                this.openModal();
            }
        });

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = this.editor.innerHTML.trim();
            if (!content) {
                alert('Please write something before posting');
                return;
            }
            this.captionInput.value = content;
            await this.uploadPost();
            this.closeModal();
        });

        this.modal.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });
    }

    initializeMediaPreview() {
        this.mediaInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.mediaPreview.innerHTML = `
                        <div class="preview-container">
                            <img src="${e.target.result}" alt="Preview">
                            <button type="button" class="remove-media">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    this.mediaPreview.querySelector('.remove-media').addEventListener('click', () => {
                        this.mediaInput.value = '';
                        this.mediaPreview.innerHTML = '';
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    openModal() {
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
        this.editor.innerHTML = '';
        this.mediaPreview.innerHTML = '';
        this.mediaInput.value = '';
    }

    async uploadPost() {
        try {
            const formData = new FormData(this.form);
            const response = await fetch('api/posts/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('Failed to upload post');
            const result = await response.json();
            if (result.success) {
                this.closeModal();
                window.feedsView.loadFeeds(window.feedsView.feedType);
            }
        } catch (error) {
            console.error('Error uploading post:', error);
        }
    }
}

class FeedsWebSocket {
    constructor() {
        this.connect();
        this.addStatusIndicator();
    }

    addStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: red;
            z-index: 9999;
        `;
        document.body.appendChild(indicator);
        this.statusIndicator = indicator;
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/DynamicForm/websocket/feeds`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.statusIndicator.style.background = 'green';
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.statusIndicator.style.background = 'red';
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onmessage = null;
        if (!this.ws.onmessage) {
            this.ws.onmessage = (event) => {
                console.log('WebSocket message received:', event.data);
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
        }
    }

    handleMessage(message) {
        console.log('Handling message:', message);
        switch (message.type) {
            case 'new_post':
                this.handleNewPost(message.data);
                break;
            case 'post_delete':
                this.handlePostDelete(message.data);
                break;
            case 'post_update':
                this.handlePostUpdate(message.data);
                break;
            case 'post_like':
                this.handlePostLike(message.data);
                break;
            case 'user_update':
                this.handleUserUpdate(message.data);
                break;
            case 'post_comment':
                this.handlePostComment(message.data);
                break;
            case 'follow_user':
                this.handleFollowUser(message.data);
                break;
            case 'comment_delete':
                this.handleCommentDelete(message.data);
                break;
            case 'profile_update':
                this.handleProfileUpdate(message.data);
                break;
        }
    }

    handleProfileUpdate(data) {
        console.log(data);
        const userProfileContainer = document.querySelector('.user-profile-container');
        let userProfileId = "";
        if (userProfileContainer) {
            console.log("1");
            userProfileId = userProfileContainer.dataset.userId;
        }
        const feedsSection = document.querySelector('.feeds-section');

        if (userProfileContainer && userProfileId == data.userId) {
            console.log("2");
            this.handleUserProfileUpdate(data, userProfileContainer);
        } else if (feedsSection) {
            console.log("3");
            this.handleFeedsProfileUpdate(data);
        }
    }

    handleUserProfileUpdate(data, userProfileContainer) {
        if (data.profilePictureUrl) {
            const profilePictureHolder = userProfileContainer.querySelector(".user-profile-picture");
            profilePictureHolder.src = data.profilePictureUrl;
        }
        if (data.username) {
            const username = userProfileContainer.querySelector(".user-profile-username");
            if (username) username.innerText = data.username;
        }
        if (data.bio) {
            const bio = userProfileContainer.querySelector(".user-profile-bio");
            if (bio) bio.innerText = data.bio;
        }

        const posts = document.querySelectorAll(".feed-card");
        posts.forEach(post => {
            if (post.dataset.userId == data.userId) {
                if (data.profilePictureUrl) {
                    const postProfilePictureHolder = post.querySelector(".user-avatar");
                    postProfilePictureHolder.src = data.profilePictureUrl;
                }
                if (data.username) {
                    const postUsername = post.querySelector(".user-name-row");
                    if (postUsername) postUsername.innerText = data.username;
                }
            }
        });
    }

    handleFeedsProfileUpdate(data) {
        const feedsContent = document.querySelectorAll(".feed-card");
        feedsContent.forEach(feed => {
            if (feed.dataset.userId == data.userId) {
                if (data.profilePictureUrl) {
                    const feedProfilePictureHolder = feed.querySelector(".user-avatar");
                    feedProfilePictureHolder.src = data.profilePictureUrl;
                }
                if (data.username) {
                    const feedUsername = feed.querySelector(".user-name-row");
                    if (feedUsername) feedUsername.innerText = data.username;
                }
            }
        });
    }

    handleCommentDelete(data) {
        const commentCard = document.querySelector(`[data-comment-id="${data.comment_id}"]`);
        if (commentCard) commentCard.remove();
    }

    handleFollowUser(data) {
        const profileContainer = document.querySelector(".user-profile-container");
        if (profileContainer) {
            const profileUserId = profileContainer.dataset.userId;
            const followersCount = document.querySelector(".followersCount");
            const followingsCount = document.querySelector(".followingsCount");

            console.log("profileUserId:" + profileUserId);
            console.log("follower_id:" + data.follower_id);
            console.log("following_id:" + data.following_id);
            if (profileUserId == data.following_id) {
                followersCount.innerText = data.followers_count;
            }
            if (profileUserId == data.follower_id) {
                console.log("hi");
                followingsCount.innerText = data.followings_count;
            }
        }
    }

    handlePostComment(data) {
        console.log("handle Post Comment Called!");
        const commentsCount = document.getElementById("commentsCount-" + data.post_id);
        const commentList = document.getElementById("comment-list-" + data.post_id);
        if (commentsCount) commentsCount.innerText = data.commentsCount;
        if (commentList) {
            const commentHtml = window.feedsView.renderCommentCard(data);
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = commentHtml;
            commentList.append(tempDiv);
        }
    }

    handleNewPost(postData) {
        const feedsContent = document.querySelector('.feeds-content');
        const postsCount = document.querySelector('.postsCount');
        if (feedsContent) {
            const postHtml = window.feedsView.renderFeedCard(postData);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = postHtml;
            feedsContent.insertBefore(tempDiv.firstElementChild, feedsContent.firstChild);
        }
        if (postsCount) postsCount.innerText = postData.posts_count;
    }

    handlePostDelete(data) {
        console.log('Handling post delete:', data);
        const temp = JSON.parse(data);
        console.log(temp.postId);
        const postElement = document.querySelector(`.feed-card[data-post-id="${temp.postId}"]`);
        if (postElement) {
            postElement.remove();
            console.log("deleted");
        }
    }

    handlePostUpdate(data) {
        const postElement = document.querySelector(`[data-post-id="${data.postId}"]`);
        if (postElement) {
            const contentEl = postElement.querySelector('.content-text');
            if (contentEl) contentEl.innerHTML = data.caption;
            const mediaEl = postElement.querySelector('.feed-media');
            if (data.imageUrl) {
                if (mediaEl) {
                    mediaEl.querySelector('img').src = data.imageUrl;
                } else {
                    postElement.querySelector('.card-content').insertAdjacentHTML('beforeend', `
                        <div class="feed-media">
                            <img src="${data.imageUrl}" alt="Post content">
                        </div>
                    `);
                }
            } else if (mediaEl) {
                mediaEl.remove();
            }
        }
    }

    handlePostLike(data) {
        console.log("handlePostLikes called!");
        const postElement = document.querySelector(`[data-post-id="${data.post_id}"]`);
        console.log(data.likes_count);
        if (postElement) {
            const likeButton = postElement.querySelector('.action-btn');
            const likeCount = postElement.querySelector('.action-btn span');
            const currentUserId = sessionStorage.getItem("userId");
            if (data.user_id == currentUserId) {
                likeButton.classList.toggle('active', data.isLiked);
            }
            if (likeCount) {
                likeCount.textContent = data.likes_count;
                console.log("gg");
            } else {
                console.log("hi");
            }
        }
    }

    handleUserUpdate(data) {
        console.log('Received user update:', data);
        console.log('Looking for user elements with ID:', data.userId);
        const feedCards = document.querySelectorAll('.feed-card');
        console.log('Found feed cards:', feedCards.length);

        feedCards.forEach(card => {
            const userInfo = card.querySelector(`.user-info[data-user-id="${data.userId}"]`);
            console.log('Found userInfo element:', userInfo);
            if (userInfo) {
                const usernameEl = userInfo.querySelector('.username');
                if (usernameEl) {
                    console.log('Updating username from', usernameEl.textContent, 'to', data.username);
                    usernameEl.textContent = data.username;
                }
                const avatarEl = userInfo.querySelector('.user-avatar');
                if (avatarEl) {
                    const newSrc = `${data.profilePic}?v=${new Date().getTime()}`;
                    console.log('Updating avatar from', avatarEl.src, 'to', newSrc);
                    avatarEl.src = newSrc;
                }
                userInfo.style.opacity = '0.99';
                setTimeout(() => userInfo.style.opacity = '1', 0);
            }
        });
    }

    notifyPostDelete(postId) {
        if (this.ws.readyState === WebSocket.OPEN) {
            console.log('Sending delete notification for post:', postId);
            const message = {
                type: 'post_delete',
                data: { postId: postId }
            };
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    }
}

class PostEditor {
    constructor() {
        this.modal = document.getElementById('edit-post-modal');
        this.form = document.getElementById('edit-post-form');
        this.mediaPreview = document.getElementById('edit-media-preview');
        this.mediaInput = document.getElementById('edit-post-media');
        this.editor = document.getElementById('edit-post-caption');
        this.captionInput = document.getElementById('edit-caption-input');
        this.postIdInput = document.getElementById('edit-post-id');
        this.initialize();
    }

    initialize() {
        this.initializeMediaPreview();
        this.modal.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updatePost();
        });
    }

    openModal(postData) {
        this.postIdInput.value = postData.postId;
        this.editor.innerHTML = postData.caption;
        this.mediaPreview.innerHTML = '';
        if (postData.imageUrl) {
            this.mediaPreview.innerHTML = `
                <div class="preview-container">
                    <img src="${postData.imageUrl}" alt="Preview">
                    <button type="button" class="remove-media">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }
        this.mediaPreview.querySelector('.remove-media')?.addEventListener('click', () => {
            this.mediaInput.value = '';
            this.mediaPreview.innerHTML = '';
        });
        this.modal.style.display = 'block';
    }

    async updatePost() {
        try {
            const postId = this.postIdInput.value;
            const caption = this.editor.innerHTML.trim();
            const mediaFile = this.mediaInput.files[0];
            const formData = new FormData();
            formData.append('caption', caption);
            if (mediaFile) formData.append('media', mediaFile);

            const response = await fetch(`api/posts/update/${postId}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                window.feedsView.showNotification('Post updated successfully', 'success');
                this.closeModal();
                window.feedsView.loadFeeds(window.feedsView.feedType);
            } else {
                window.feedsView.showNotification(data.message || 'Failed to update post', 'error');
            }
        } catch (error) {
            console.error('Error updating post:', error);
            window.feedsView.showNotification('Error updating post', 'error');
        }
    }

    initializeMediaPreview() {
        this.mediaInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.mediaPreview.innerHTML = `
                        <div class="preview-container">
                            <img src="${e.target.result}" alt="Preview">
                            <button type="button" class="remove-media">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    this.mediaPreview.querySelector('.remove-media').addEventListener('click', () => {
                        this.mediaInput.value = '';
                        this.mediaPreview.innerHTML = '';
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
        this.editor.innerHTML = '';
        this.mediaPreview.innerHTML = '';
        this.mediaInput.value = '';
    }
}

window.feedsView = new FeedsView();
window.postUploader = new PostUploader();
window.postEditor = new PostEditor();