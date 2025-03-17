class ProfileManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        document.addEventListener('DOMContentLoaded', () => this.handlePageLoad());
        this.selectedNewTags = []; // To store newly selected tags before adding
    }

    initializeElements() {
        this.modal = document.getElementById('edit-profile-modal');
        this.profileTrigger = document.getElementById('profile-trigger');
        this.editTrigger = document.querySelector('.user-profile-options-edit');
        this.closeBtn = document.querySelector('.close');
        this.editProfileForm = document.getElementById('edit-profile-form');
        this.profileUpload = document.getElementById('profile-upload');
        this.previewProfileImg = document.getElementById('preview-profile-img');
        this.mainProfileImg = document.getElementById('profile-img');
        this.usernameElement = document.getElementById('username');
        this.bioElement = document.getElementById('user-bio');
        this.removePfpButton = document.querySelector(".removePfpButton");
        // Tags Section Elements
        this.userTagsContainer = document.getElementById('user-tags');
        this.addTagBtn = document.getElementById('add-tag-btn');
        this.removeTagBtn = document.getElementById('remove-tag-btn');
        this.addTagSection = document.getElementById('add-tag-section');
        this.tagSearchBar = document.getElementById('tag-search-bar');
        this.availableTagsContainer = document.getElementById('available-tags');
        this.selectedNewTagsContainer = document.getElementById('selected-new-tags');
        this.addSelectedTagsBtn = document.getElementById('add-selected-tags-btn');
    }

    setupEventListeners() {
        if (this.profileTrigger) {
            this.profileTrigger.addEventListener('click', () => this.openModal());
        }

        if (this.editTrigger) {
            this.editTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }

        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        if (this.profileUpload) {
            this.profileUpload.addEventListener('change', (e) => this.handleProfilePictureChange(e));
        }

        if (this.editProfileForm) {
            this.editProfileForm.addEventListener('submit', (e) => this.handleFormSubmission(e));
        }

        if (this.addTagBtn) {
            this.addTagBtn.addEventListener('click', () => this.toggleAddTagSection());
        }

        if (this.removeTagBtn) {
            this.removeTagBtn.addEventListener('click', () => this.toggleRemoveTagMode());
        }

        if (this.tagSearchBar) {
            this.tagSearchBar.addEventListener('input', (e) => this.searchTags(e.target.value));
        }

        if (this.addSelectedTagsBtn) {
            this.addSelectedTagsBtn.addEventListener('click', () => this.addSelectedTags());
        }
    }

    async handlePageLoad() {
        const user_id = sessionStorage.getItem("userId");
        if (!user_id) {
            window.location.href = 'login.html';
            return;
        }
        this.loadUserProfile();
    }

    loadUserProfile() {
        fetch('api/profile/get')
            .then(async response => {
                if (response.status === 401) {
                    window.location.href = 'login.html';
                    return;
                }
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to fetch profile');
                }
                return response.json();
            })
            .then(data => data && this.updateProfileUI(data))
            .catch(error => {
                console.error('Error loading profile:', error);
                this.showNotification('Failed to load profile', 'error');
            });
    }

    updateProfileUI(data) {
        if (this.mainProfileImg && data.profilePictureUrl) {
            this.mainProfileImg.src = data.profilePictureUrl || 'images/default-profile.jpg';
        }
        if (this.usernameElement && data.username) {
            this.usernameElement.textContent = data.username || 'Username';
        }
        if (this.bioElement && data.bio) {
            this.bioElement.textContent = data.bio || 'Your bio appears here...';
        }
        if (this.userTagsContainer && data.tags) {
            this.renderUserTags(data.tags); // Render existing tags
        }
    }

    openModal() {
        this.modal.style.display = 'block';
        this.populateEditForm();
    }

	closeModal() {
	        this.modal.style.display = 'none';
	        this.addTagSection.style.display = 'none';
	        this.selectedNewTags = [];
	        this.renderSelectedNewTags();
	        if (this.removeTagBtn.classList.contains('active')) {
	            this.toggleRemoveTagMode(); // Reset remove mode
	        }
	    }

    populateEditForm() {
        if (this.mainProfileImg.src === 'http://localhost:8080/DynamicForm/images/default-profile.jpg') {
            this.removePfpButton.style.display = "none";
        } else {
            this.removePfpButton.style.display = "block";
        }
        if (this.previewProfileImg && this.mainProfileImg) {
            this.previewProfileImg.src = this.mainProfileImg.src;
        }

        const editUsername = document.getElementById('edit-username');
        const editBio = document.getElementById('edit-bio');

        if (editUsername && this.usernameElement) {
            editUsername.value = this.usernameElement.textContent;
        }
        if (editBio && this.bioElement) {
            editBio.value = this.bioElement.textContent;
        }
        this.loadUserTags(); // Load user's current tags
    }

    handleProfilePictureChange(e) {
        const file = e.target.files[0];
        if (file && this.validateImage(file)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (this.previewProfileImg) {
                    this.previewProfileImg.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    validateImage(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (!validTypes.includes(file.type)) {
            this.showNotification('Please upload a valid image file (JPG, PNG, or GIF)', 'error');
            return false;
        }
        if (file.size > maxSize) {
            this.showNotification('File size must be less than 5MB', 'error');
            return false;
        }
        return true;
    }

    handleFormSubmission(e) {
        e.preventDefault();
        this.updateProfile();
    }

    removePfp() {
        console.log("removePfp called!");
        const userId = sessionStorage.getItem("userId");
        fetch('RemovePfpServlet?userId=' + userId, { method: "POST" })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateProfileUI(data);
                    this.closeModal();
                    this.showNotification('Profile picture removed successfully!');
                }
            });
    }

    updateProfile() {
        const formData = new FormData();
        const username = document.getElementById('edit-username')?.value.trim();
        const bio = document.getElementById('edit-bio')?.value.trim();
        let profilePicture = this.profileUpload?.files[0];

        if (!username) {
            this.showNotification('Username cannot be empty', 'error');
            return;
        }

        formData.append('username', username);
        formData.append('bio', bio || '');
        if (profilePicture) {
            formData.append('profilePicture', profilePicture);
        }

        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            fetch('api/profile/update', {
                method: 'POST',
                body: formData
            })
                .then(async response => {
                    const data = await response.json();
                    if (!response.ok) {
                        if (response.status === 409) {
                            throw new Error('Username already exists. Please choose another one.');
                        }
                        throw new Error(data.message || `HTTP error! status: ${response.status}`);
                    }
                    return data;
                })
                .then(data => {
                    if (data.success) {
                        this.updateProfileUI(data.profile);
                        this.closeModal();
                        this.showNotification('Profile updated successfully!');
                    } else {
                        throw new Error(data.message || 'Failed to update profile');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.showNotification(error.message || 'Failed to update profile. Please try again.', 'error');
                    if (error.message.includes('Username already exists')) {
                        const usernameInput = document.getElementById('edit-username');
                        if (usernameInput) {
                            usernameInput.focus();
                            usernameInput.select();
                        }
                    }
                })
                .finally(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                });
        }
    }

    // Tags Management
    loadUserTags() {
        const userId = sessionStorage.getItem("userId");
        fetch(`FetchUserTagsServlet?userId=${userId}`)
            .then(response => response.json())
            .then(data => {
                this.renderUserTags(data);
            })
            .catch(error => {
                console.error('Error fetching user tags:', error);
                this.showNotification('Failed to load tags', 'error');
            });
    }

    renderUserTags(tags) {
        this.userTagsContainer.innerHTML = '';
        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('tag');
            tagElement.textContent = tag.tag;
            tagElement.dataset.tagId = tag.tag_id;
            this.userTagsContainer.appendChild(tagElement);
        });
    }

    toggleAddTagSection() {
        this.addTagSection.style.display = this.addTagSection.style.display === 'none' ? 'block' : 'none';
        this.tagSearchBar.value = ''; // Clear search bar
        this.selectedNewTags = []; // Clear selected new tags
        this.renderSelectedNewTags();
        this.fetchAvailableTags(''); // Fetch initial tags
    }

	toggleRemoveTagMode() {
	        const tags = this.userTagsContainer.querySelectorAll('.tag');
	        const isActive = this.removeTagBtn.classList.contains('active');
	        
	        if (!isActive) {
	            // Entering remove mode
	            this.removeTagBtn.classList.add('active');
	            this.removeTagBtn.textContent = 'Cancel Remove'; // Change button text
	            tags.forEach(tag => {
	                tag.classList.add('removable');
	                tag.addEventListener('click', this.removeTagHandler); // Bind handler
	            });
	            this.showNotification('Click a tag to remove it', 'success');
	        } else {
	            // Exiting remove mode
	            this.removeTagBtn.classList.remove('active');
	            this.removeTagBtn.textContent = 'Remove Tag'; // Reset button text
	            tags.forEach(tag => {
	                tag.classList.remove('removable');
	                tag.removeEventListener('click', this.removeTagHandler); // Unbind handler
	            });
	        }
	    }
	
	removeTagHandler = (e) => {
	        const tagId = e.target.dataset.tagId;
	        this.removeTag(tagId);
	    }

    removeTag(tagId) {
	        const userId = sessionStorage.getItem("userId");
	        fetch(`RemoveUserTagServlet?userId=${userId}&tagId=${tagId}`, { method: 'POST' })
	            .then(response => response.json())
	            .then(data => {
	                if (data.success) {
	                    this.loadUserTags(); // Refresh tags
	                    this.showNotification('Tag removed successfully!');
	                    // Check if any tags are still removable; if not, exit remove mode
	                    const remainingTags = this.userTagsContainer.querySelectorAll('.tag');
	                    if (remainingTags.length === 0) {
	                        this.toggleRemoveTagMode(); // Exit remove mode if no tags left
	                    }
	                } else {
	                    this.showNotification('Failed to remove tag', 'error');
	                }
	            })
	            .catch(error => {
	                console.error('Error removing tag:', error);
	                this.showNotification('Failed to remove tag', 'error');
	            });
	    }

    fetchAvailableTags(searchTerm) {
        fetch(`FetchTagsServlet?input=${encodeURIComponent(searchTerm)}&isRandom=false`)
            .then(response => response.json())
            .then(data => {
                this.renderAvailableTags(data);
            })
            .catch(error => {
                console.error('Error fetching tags:', error);
                this.showNotification('Failed to fetch tags', 'error');
            });
    }

    renderAvailableTags(tags) {
        this.availableTagsContainer.innerHTML = '';
        const currentTags = Array.from(this.userTagsContainer.querySelectorAll('.tag')).map(t => t.dataset.tagId);
        const availableTags = tags.filter(t => !currentTags.includes(String(t.tag_id)) && !this.selectedNewTags.some(st => st.tag_id === t.tag_id));
        availableTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('tag');
            tagElement.textContent = tag.tag;
            tagElement.dataset.tagId = tag.tag_id;
            tagElement.addEventListener('click', () => this.selectNewTag(tag));
            this.availableTagsContainer.appendChild(tagElement);
        });
    }

    selectNewTag(tag) {
        this.selectedNewTags.push(tag);
        this.renderSelectedNewTags();
        this.fetchAvailableTags(this.tagSearchBar.value); // Refresh available tags
    }

    renderSelectedNewTags() {
        this.selectedNewTagsContainer.innerHTML = '';
        this.selectedNewTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('selected-tag');
            tagElement.textContent = tag.tag;
            tagElement.dataset.tagId = tag.tag_id;
            tagElement.addEventListener('click', () => this.deselectNewTag(tag));
            this.selectedNewTagsContainer.appendChild(tagElement);
        });
    }

    deselectNewTag(tag) {
        this.selectedNewTags = this.selectedNewTags.filter(t => t.tag_id !== tag.tag_id);
        this.renderSelectedNewTags();
        this.fetchAvailableTags(this.tagSearchBar.value); // Refresh available tags
    }

    searchTags(searchTerm) {
        this.fetchAvailableTags(searchTerm);
    }

    addSelectedTags() {
        const userId = sessionStorage.getItem("userId");
        const tagIds = this.selectedNewTags.map(tag => tag.tag_id);
        if (tagIds.length === 0) {
            this.showNotification('Please select at least one tag', 'error');
            return;
        }

        fetch('SubmitTagsServlet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `user_id=${userId}&tag_ids=${encodeURIComponent(JSON.stringify(tagIds))}`
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.loadUserTags(); // Refresh tags
                    this.toggleAddTagSection(); // Hide add tag section
                    this.showNotification('Tags added successfully!');
                } else {
                    this.showNotification('Failed to add tags', 'error');
                }
            })
            .catch(error => {
                console.error('Error adding tags:', error);
                this.showNotification('Failed to add tags', 'error');
            });
    }

    showNotification(message, type = 'success') {
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notificationContainer.querySelectorAll('.notification').forEach(notif => notif.remove());
        notificationContainer.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }
}

window.profileManager = new ProfileManager();