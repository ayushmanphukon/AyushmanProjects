class ProjectManager {
    constructor() {
        this.fetchTagsGlobal(true);
        this.contentDiv = document.querySelector('.main-content');
        this.tagsSelected = [];
        this.searchedTags = [];
        this.randomTags = [];
        this.interests = [];
        this.currentTagType = null;
        this.addTagsHandler = this.handleAddTagsClick.bind(this);
        if (!this.contentDiv) {
            console.error("Element with class 'main-content' not found!");
            return;
        }
        this.initialize();
    }
    
    handleAddTagsClick() {
        this.addSearchedTags(this.currentTagType);
    }
    
    disableScroll() {
        window.onscroll = null;
        const scrollTopBtn = document.getElementById("scrollTopBtn");
        if (scrollTopBtn) {
            scrollTopBtn.style.display = "none";
        }
        console.log("scroll disabled");
    }

    initialize() {
        const projectsBtn = document.getElementById('projects');
        if (projectsBtn) {
            projectsBtn.addEventListener('click', () => this.renderProjects());
        } else {
            console.error("Projects button not found!");
        }
    }

    timeAgo(timestamp) {
        let time = new Date(timestamp);
        let now = new Date();
        let diff = Math.floor((now - time) / 1000);
        if (diff < 60) return `${diff} sec ago`;
        let minutes = Math.floor(diff / 60);
        if (minutes < 60) return `${minutes} min ago`;
        let hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hrs ago`;
        let days = Math.floor(hours / 24);
        if (days < 7) return `${days} days ago`;
        let weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} weeks ago`;
        let months = Math.floor(days / 30);
        if (months < 12) return `${months} months ago`;
        let years = Math.floor(days / 365);
        return `${years} years ago`;
    }

	renderProjects() {
	    if (!this.contentDiv) return;
	    this.disableScroll();
	    this.contentDiv.innerHTML = `
	        <div class="project-card-preview-backdrop" id="previewBackdrop"></div> <!-- Backdrop for preview -->
	        <div class="projects-section">
	            <div class="projects-main-header">
	                <div class="projects-header">
	                    <h1 class="projects-title">Projects</h1>
	                    <button class="new-project-btn" id="openProjectForm">
	                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	                            <path d="M12 5v14M5 12h14"/>
	                        </svg>
	                        <span>New Project</span>
	                    </button>
	                </div>
	                <div class="search-container">
	                    <input type="text" id="searchProjects" placeholder="Search Projects...">
	                </div>
	                <div class="projects-column">
	                    <div class="project-column-default">
	                        <div class="project-option active" id="all-projects">
	                            <span>All Projects</span>
	                        </div>
	                    </div>
	                    <div class="add-interests">
	                        <span>
	                            ADD Interests
	                        </span>
							<i class="fas fa-plus"></i>
	                    </div>
	                </div>
	            </div>
	            <div class="projects-grid" id="project-list">
	            </div>
	        </div>
	        <div id="project-form-modal" class="modal">
	            <div class="project-modal-content">
	                <span class="close-btn" id="closeProjectsModal">x</span>
	                <h2>Create New Project</h2>
	                <form id="projectForm">
	                    <input type="text" name="project_name" placeholder="Project Name" required>
	                    <textarea name="description" placeholder="Description" required></textarea>
	                    <textarea name="requirements" placeholder="requirements" required></textarea>
	                    <input type="number" name="people_required" placeholder="People Required" min="1" required>
	                    <div class="tags-section">
	                        <div class="add-more-tags-holder">
	                            <div id="add-more-tags">
	                                ADD TAGS <i class="fas fa-plus"></i>
	                            </div>
	                        </div>
	                        <div class="tags-grid">
	                            ${this.randomTags.map(tag => this.renderTagCard(tag)).join('')}
	                        </div>
	                        <input type="hidden" name="selected_tags" id="selectedTags">
	                    </div>
	                    <button class="project-submit" type="submit">Create</button>
	                </form>
	            </div>
	        </div>
	        <div id="addTags-form-modal" class="modal">
	            <div class="addTags-modal-content">
	                <span class="close-btn" id="closeTagsModal">x</span>
	                <div class="search-container">
	                    <input type="text" id="searchTags" placeholder="Search Tags...">
	                </div>
	                <div class="addtags-grid">
	                </div>
	                <button class="add-tags">add+</button>
	            </div>
	        </div>
	        <div class="project-card-preview" id="projectPreview">
	            <!-- Preview content will be populated dynamically -->
	        </div>
	    `;
	    this.fetchProjects("hey", false, null);

	    // Event Listeners
	    document.getElementById("openProjectForm").addEventListener("click", () => this.openProjectForm());
	    document.getElementById("closeProjectsModal").addEventListener("click", () => this.closeProjectForm());
	    document.getElementById("projectForm").addEventListener("submit", (event) => this.submitProjectForm(event));
	    document.getElementById("searchProjects").addEventListener("input", (e) => {
	        const query = e.target.value.trim();
	        if (query.length === 0) {
	            this.fetchProjects("hey", false, null);
	            return;
	        }
	        if (query.length >= 1) {
	            this.fetchProjects(query, true, null);
	        }
	    });

	    const allProjectsBtn = document.getElementById("all-projects");
	    const projectColumnDefault = document.querySelector(".project-column-default");
	    allProjectsBtn.addEventListener("click", () => {
	        const allColumnBtn = projectColumnDefault.querySelectorAll(".project-option");
	        allColumnBtn.forEach(columnBtn => {
	            columnBtn.classList.remove("active");
	        });
	        allProjectsBtn.classList.add("active");
	        this.fetchProjects("hey", false, null);
	    });

	    document.querySelector(".add-interests").addEventListener("click", () => this.openTagsModal("interests"));
	}
	
	renderProjectCardPreview(data) {
	    const projectPreview = document.getElementById("projectPreview"); // Use ID instead of class
	    const previewBackdrop = document.getElementById("previewBackdrop");
	    if (!projectPreview || !previewBackdrop) {
	        console.error("Project preview or backdrop container not found!");
	        return;
	    }
	    if (!data || typeof data !== 'object') {
	        console.error("Invalid project data:", data);
	        projectPreview.innerHTML = "<p>Error: No valid project data available.</p>";
	        return;
	    }
	    console.log("Rendering preview for:", data);
	    projectPreview.innerHTML = this.projectCard(data);
	    projectPreview.style.display = "block"; // Show the preview
	    previewBackdrop.style.display = "block"; // Show the backdrop

	    // Add close event listener
	    const closeBtn = document.getElementById("closePreviewBtn");
	    if (closeBtn) {
	        closeBtn.addEventListener("click", () => this.closeProjectPreview());
	    }

	    // Optional: Close on backdrop click
	    previewBackdrop.addEventListener("click", () => this.closeProjectPreview());
	}

	closeProjectPreview() {
	    const projectPreview = document.getElementById("projectPreview");
	    const previewBackdrop = document.getElementById("previewBackdrop");
	    if (projectPreview && previewBackdrop) {
	        projectPreview.style.display = "none";
	        previewBackdrop.style.display = "none";
	        projectPreview.innerHTML = ""; // Clear content
	    }
	}
	
	projectCard(project) {
	    return `
	        <button class="close-preview-btn" id="closePreviewBtn">x</button> <!-- Close button -->
	        <div class="project-header">
	            <!-- Existing header content -->
	        </div>
	        <h2 class="project-title">${project.project_name}</h2>
	        <p class="project-description">${project.description}</p>
	        <!-- Requirements Section -->
	        <div class="project-requirements">
	            <h3>Requirements</h3>
	            <ul>
	                ${project.requirements && project.requirements.length > 0
	                    ? project.requirements
	                    : '<li>No specific requirements listed</li>'}
	            </ul>
	        </div>
	        <!-- Tags Section -->
	        <div class="project-tags">
	            <h3>Tags</h3>
	            <div class="tags-container">
	                ${Array.isArray(project.tags) && project.tags.length > 0
	                    ? project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
	                    : '<p class="no-tags">No tags added</p>'}
	            </div>
	        </div>
	        <!-- Members Section -->
	        <div class="project-members-section">
	            <h3>Who Joined?</h3>
	            <div class="members-container">
	                ${Array.isArray(project.members) && project.members.length > 0
	                    ? project.members.map(member =>
	                        `<div class="member">
	                            <img src="${member.profile_picture_url || 'default.jpg'}" alt="${member.username}" class="member-pic">
	                            <p>${member.username}</p>
	                        </div>`
	                    ).join('')
	                    : '<p class="no-members">No members joined yet</p>'}
	            </div>
	        </div>
	        <div class="project-footer">
	            <span><i class="fas fa-users"></i> ${project.people_required} people required</span>
	            <span><i class="far fa-clock"></i> ${this.timeAgo(project.created_at)}</span>
	        </div>
	        <div class="button-footer">
	            <button class="join-btn">Join Project</button>
	        </div>
	    `;
	}
    
    openTagsModal(type) {
        this.currentTagType = type;
        const closeTagsModalBtn = document.getElementById("closeTagsModal");
        closeTagsModalBtn.removeEventListener("click", this.handleCloseTagsModal);
        closeTagsModalBtn.addEventListener("click", this.handleCloseTagsModal);
        document.getElementById("addTags-form-modal").style.display = "block";
        const searchTagsInput = document.getElementById("searchTags");
        searchTagsInput.removeEventListener("input", this.handleSearchTags);
        searchTagsInput.addEventListener("input", this.handleSearchTags);
        const tagsGrid = document.querySelector(".addtags-grid");
        tagsGrid.removeEventListener("click", this.handleTagSelection);
        tagsGrid.addEventListener("click", this.handleTagSelection);
        const addTagsBtn = document.querySelector(".add-tags");
        addTagsBtn.removeEventListener("click", this.addTagsHandler);
        addTagsBtn.addEventListener("click", this.addTagsHandler);
    }

    handleCloseTagsModal = () => this.closeTagsModal();

    handleSearchTags = (e) => {
        const query = e.target.value.trim();
        console.log("query:" + query);
        if (query.length === 0) {
            this.hideTags();
            return;
        }
        if (query.length >= 1) {
            console.log("called!");
            this.fetchTags(query, false);
        } else {
            console.log("didnt call");
        }
    };

    handleTagSelection = (event) => {
        if (event.target.classList.contains("tag-btn")) {
            console.log("atcha");
            event.target.classList.toggle("active");
        }
    };

	addSearchedTags(type) {
	    console.log(type);
	    this.searchedTags = [];
	    this.tagsSelected = [];
	    if (type === "interests") {
	        this.interests = [];
	    }
	    document.querySelectorAll(".tag-btn.active").forEach(selectedTag => {
	        const tagValue = selectedTag.getAttribute("data-value");
	        if (type === "interests") {
	            this.interests.push(tagValue);
	        } else {
	            this.searchedTags.push(tagValue);
	        }
	    });

	    if (type === "interests") {
	        const projectColumnDefault = document.querySelector(".project-column-default");
	        const tempHtml = this.interests.map(interest => this.interestColumnCard(interest)).join('');
	        projectColumnDefault.insertAdjacentHTML('beforeend', tempHtml);

	        // Attach event listeners to new interest options
	        const allColumns = projectColumnDefault.querySelectorAll(".project-option");
	        projectColumnDefault.querySelectorAll(".project-option[data-interest]").forEach(option => {
	            option.addEventListener("click", () => {
	                const interest = option.getAttribute("data-interest");
	                allColumns.forEach(column => {
	                    column.classList.remove("active");
	                });
	                option.classList.add("active");
	                this.fetchProjects("hey", false, interest);
	            });
	        });
	    } else {
	        const tempHtml = this.searchedTags.map(tag => this.renderTagCard2(tag)).join('');
	        document.querySelector(".tags-grid").innerHTML += tempHtml;
	    }
	    this.closeTagsModal();
	}

    interestColumnCard(interest) {
        return `
            <div class="project-option" data-interest="${interest}">
                <span>${interest}</span>
            </div>
        `;
    }
    
    closeTagsModal() {
        const modal = document.getElementById("addTags-form-modal");
        modal.style.display = "none";
        document.getElementById("searchTags").value = "";
        document.querySelectorAll(".tag-btn.active").forEach(btn => {
            btn.classList.remove("active");
        });
        document.querySelector(".addtags-grid").innerHTML = "";
        console.log("Tags modal reset!");
    }

    hideTags() {
        document.querySelector(".addtags-grid").innerHTML = "";
    }
    
    fetchTagsGlobal(isRandom) {
        fetch('FetchTagsServlet?&isRandom=' + isRandom, { method: "Get" })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                this.loadGlobalTags(data);
            });
    }
    
    loadGlobalTags(data) {
        data.forEach(tag => {
            this.randomTags.push(tag);
        });
    }
    
    fetchTags(input, isRandom) {
        fetch('FetchTagsServlet?input=' + input + '&isRandom=' + isRandom, { method: "Get" })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                this.renderTags(data);
            });
    }
    
    renderTags(data) {
        const tagsHtml = `
        ${data.map(tag => this.renderTagCard(tag)).join('')}
        `;
        const tagsGrid = document.querySelector(".addtags-grid");
        tagsGrid.innerHTML = tagsHtml;
    }
    
    renderTagCard(tag) {
        return `
            <button type="button" class="tag-btn" data-value="${tag.tag}">${tag.tag}</button>
        `;
    }
    
    renderTagCard2(tag) {
        return `
            <button type="button" class="tag-btn" data-value="${tag}">${tag}</button>
        `;
    }

	fetchProjects(alike, isSearching, tag) {
	    let url = 'FetchProjectsServlet?alike=' + alike + '&isSearching=' + isSearching;
	    if (tag !== null) {
	        url += '&tag=' + encodeURIComponent(tag);
	    }
	    fetch(url, { method: "Get" })
	        .then(response => response.json())
	        .then(data => {
	            console.log("Fetched projects:", data);
	            let projectContainer = document.getElementById("project-list");
	            if (!projectContainer) {
	                console.error("Project list container not found!");
	                return;
	            }
	            projectContainer.innerHTML = "";
	            data.forEach(project => {
	                let card = `
	                    <div class="project-card">
	                        <div class="project-header">
	                            <div class="user-info-header">
	                                <img src="${project.creator_profile_picture || 'default.jpg'}" alt="${project.creator_username || 'Unknown'}" class="profile-pic">
	                                <div class="p-user-info">
	                                    <h4>${project.creator_username || 'Unknown'}</h4>
	                                    <p>Project Lead</p>
	                                </div>
	                            </div>
	                            <div class="post-options">
	                                <button type="button" class="options-btn">
	                                    <i class="fas fa-ellipsis-v"></i>
	                                </button>
	                                <div class="options-menu">
	                                    ${5 === 5 ? `
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
	                        <h2 class="project-title">${project.project_name || 'Untitled'}</h2>
	                        <p class="project-description">${project.description || 'No description'}</p>
	                        <div class="project-footer">
	                            <span><i class="fas fa-users"></i> ${project.people_required || 0}</span>
	                            <span><i class="far fa-clock"></i> ${this.timeAgo(project.created_at || Date.now())}</span>
	                        </div>
	                        <div class="project-members">
	                            ${Array.isArray(project.members) && project.members.length > 0
	                            ? project.members.map(member =>
	                                `<img src="${member.profile_picture_url || 'default.jpg'}" alt="${member.username || 'Unknown'}" class="member-pic">`
	                            ).join('')
	                            : '<p class="no-members">No members joined yet</p>'}
	                        </div>
	                        <div class="button-footer">
	                            <button class="join-btn">Join Project</button>
	                            <button class="join-btn view-details-btn" data-project='${JSON.stringify(project).replace(/'/g, "'")}'>View Details</button>
	                        </div>
	                    </div>`;
	                projectContainer.insertAdjacentHTML("beforeend", card);
	            });

	            // Attach event listeners after rendering
	            this.attachViewDetailsListeners();
	        })
	        .catch(error => console.error("Error fetching projects:", error));
	}

	// New method to attach event listeners
	attachViewDetailsListeners() {
	    const buttons = document.querySelectorAll(".view-details-btn");
	    console.log("Found view-details-btn elements:", buttons.length);
	    buttons.forEach(btn => {
	        btn.addEventListener("click", (e) => {
	            console.log("View Details clicked!", e.target);
	            const projectData = JSON.parse(e.target.getAttribute("data-project"));
	            console.log("Project data:", projectData);
	            this.renderProjectCardPreview(projectData);
	        });
	    });
	}
    
    toggleTagSelection(event) {
        console.log("hii");
        event.target.classList.toggle('active');
    }

    openProjectForm() {
        document.getElementById("project-form-modal").style.display = "block";
        const addMoreTagsBtn = document.getElementById("add-more-tags");
        addMoreTagsBtn.removeEventListener("click", this.handleAddMoreTags);
        addMoreTagsBtn.addEventListener("click", this.handleAddMoreTags);
        const tagsGrid = document.querySelector(".tags-grid");
        tagsGrid.removeEventListener("click", this.handleTagClick);
        tagsGrid.addEventListener("click", this.handleTagClick.bind(this));
    }
    
    handleTagClick(event) {
        const tagButton = event.target.closest(".tag-btn");
        if (tagButton) {
            tagButton.classList.toggle("active");
        }
    }
    
    handleAddMoreTags = () => this.openTagsModal("createProjectTags");
    
    updateSelectedTags() {
        this.tagsSelected = []; // Clear array before updating
        document.querySelectorAll('.tag-btn.active').forEach(btn => {
            this.tagsSelected.push(btn.getAttribute('data-value'));
        });
        document.getElementById('selectedTags').value = this.tagsSelected.join(', ');
        console.log(this.tagsSelected);
    }

    closeProjectForm() {
        const modal = document.getElementById("project-form-modal");
        modal.style.display = "none";
        let form = document.getElementById("projectForm");
        form.reset();
        this.tagsSelected = [];
        document.getElementById('selectedTags').value = "";
        document.querySelectorAll('.tag-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        const tagsGrid = document.querySelector(".tags-grid");
        tagsGrid.removeEventListener("click", this.handleTagClick);
        console.log("Project form reset!");
    }

    submitProjectForm(event) {
        event.preventDefault();
        let form = document.getElementById("projectForm");
        let projectName = form.project_name.value.trim();
        let description = form.description.value.trim();
        let requirements = form.requirements.value.trim();
        let peopleRequired = form.people_required.value.trim();
        this.updateSelectedTags();
        if (!projectName || !description || !peopleRequired) {
            alert("All fields are required!");
            return;
        }
        let formData = {
            project_name: projectName,
            description: description,
            requirements: requirements,
            people_required: peopleRequired,
            select_tags: this.tagsSelected
        };
        fetch('CreateProjectServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => {
            return response.text().then(text => {
                console.log("Raw Response:", text);
                return JSON.parse(text);
            });
        })
        .then(data => {
            console.log("Server Response:", data);
            if (data.success) {
                this.closeProjectForm();
                this.fetchProjects("hey", false, null); // Explicitly call with null tag
            } else {
                alert("Error: " + data.error);
                console.error("Server Response Error:", data.error);
            }
        })
        .catch(error => {
            alert("Failed to submit project. " + error.message);
            console.error("Error submitting project:", error);
        });
    }   
}

document.addEventListener("DOMContentLoaded", () => new ProjectManager());