class Messages {
    constructor() {
        // DOM element references
        this.contentDiv = document.querySelector('.main-content');

        // State variables
        this.newUserId = 0;
        this.groupId = 0;
        this.contacts = [];
        this.groups = [];
        this.currentUser = null;
        this.chatObject = {};
        this.isContactsLoaded = false;
        this.isGroupsLoaded = false;

        // Initialize the chat system
        this.initializer();
    }
	
	disableScroll() {
		    window.onscroll = null;
			const scrollTopBtn = document.getElementById("scrollTopBtn");
			if(scrollTopBtn){
				scrollTopBtn.style.display = "none";
			}
			console.log("scroll disabled");
		}

    // === Initialization Methaods ===

    // Sets up the chat interface and event listeners
    initializer() {
		this.disableScroll();
        this.contentDiv.innerHTML = ""; // Clear existing content
        this.clientSocket = null; // WebSocket connection

        // Insert chat HTML structure
        this.contentDiv.innerHTML = `
            <section id="chatSection">
                <div id="users_window">
                    <div id="search_box">
                        <input type="text" id="search_bar" placeholder="Search Users or Groups">
                    </div>
                    <div id="contact_tabs">
                        <button class="tab_button active" id="users_tab">Users</button>
                        <button class="tab_button" id="groups_tab">Groups</button>
                    </div>
                    <div id="contacts_section"></div>
                </div>
                <div id="chat_window">
                    <img src="https://jotechapps.com/images/social%20chatting.png" id="chatImage">
                    <div class="chat_child">
                        <div id="chat_header">
                            <div id="header_content"></div>
                            <div id="option_tab"></div>
                        </div>
                        <div id="chat_space">
                            <div id="chatDisplay"></div>
                        </div>
                        <div id="writing_space">
                            <div id="file_icon"><i class="fa-solid fa-paperclip"></i></div>
                            <input type="text" name="message" id="message_input" placeholder="Type a Message">
                            <div id="send_icon"><i class="fa-solid fa-paper-plane"></i></div>
                        </div>
                    </div>
                    <input type="file" id="fileInput" style="display:none;" />
                </div>
            </section>
        `;

        // Cache DOM elements
        this.textbox = document.getElementById("message_input");
        this.sendButton = document.getElementById("send_icon");
        this.contactsContainer = document.getElementById('contacts_section');
        this.messagesContainer = document.getElementById('chatDisplay');
        this.chatHeader = document.getElementById("header_content");
        this.writingSpace = document.getElementById("writing_space");
        this.searchInput = document.getElementById("search_bar");
        this.fileInput = document.getElementById('fileInput');
        this.fileIcon = document.getElementById('file_icon');

        // Initialize state
        this.receiverId = null;
        this.currentUser = {};

        // Set up event listeners
        this.setupEventListeners();

        // Fetch initial data
        this.fetchContacts();
    }

    // Sets up all event listeners for the chat interface
    setupEventListeners() {
        this.contactsContainer.addEventListener('click', this.handleContactClick.bind(this));
        this.textbox.addEventListener("keydown", (event) => {
            if (event.key === "Enter") this.sendMessage();
        });
        this.sendButton.addEventListener("click", this.sendMessage.bind(this));
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.fileIcon.addEventListener('click', () => this.fileInput.click());
        document.getElementById('users_tab').addEventListener('click', this.switchToUsersTab.bind(this));
        document.getElementById('groups_tab').addEventListener('click', this.switchToGroupsTab.bind(this));
    }

    // === UI Management Methods ===

    // Switches to Users tab and displays contact list
    switchToUsersTab() {
        document.getElementById('users_tab').classList.add('active');
        document.getElementById('groups_tab').classList.remove('active');
        this.hideChatContent();
        this.contactsContainer.innerHTML = "";
        this.renderContacts(this.contacts);
    }

    // Switches to Groups tab and displays group list
    switchToGroupsTab() {
        document.getElementById('groups_tab').classList.add('active');
        document.getElementById('users_tab').classList.remove('active');
        this.hideChatContent();
        this.contactsContainer.innerHTML = "";
		this.fetchGroups();
    }

    // Updates the chat header with contact or group information
    updateChatHeader(contactOrGroup) {
        this.chatHeader.innerHTML = "";
        this.messagesContainer.innerHTML = "";

        const profile = document.createElement("img");
        profile.src = contactOrGroup.profileImage || contactOrGroup.groupImage || 'images/default-profile.jpg';

        const head = document.createElement("div");
        head.classList.add("user-status");
        head.innerHTML = ` <b>${contactOrGroup.userName || contactOrGroup.groupName}</b>`;

        this.chatHeader.appendChild(profile);
        this.chatHeader.appendChild(head);
    }

    // Hides the default chat image and shows conversation area
    hideChatImage() {
        document.getElementById("chatImage").style.display = "none";
        document.querySelector(".chat_child").style.display = "flex";
        this.writingSpace.style.display = "flex";
    }

    // Hides chat content when switching tabs
    hideChatContent() {
        document.getElementById("chatImage").style.display = "flex";
        document.querySelector(".chat_child").style.display = "none";
    }

    // === Contact/Group Handling Methods ===

    // Fetches contact data from server and initializes WebSocket
    fetchContacts() {
        fetch('ContactsData', {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => response.json())
            .then(data => {
                this.contacts.push(...data.contacts);
                this.currentUser = data.currentUser;
                this.renderContacts(this.contacts);

                // Initialize WebSocket connection
                this.clientSocket = new WebSocket(`ws://localhost:8080/DynamicForm/connectServer?userId=${this.currentUser.userId}`);
                this.clientSocket.onopen = () => console.log("Connected to WebSocket");
                this.clientSocket.onmessage = (event) => {
                    this.receivedMessage = JSON.parse(event.data);
                    this.displayReceivedMessage(this.receivedMessage);
                    this.scrollToBottom();
                };
                this.isContactsLoaded = true;
            });
    }

    // Fetches group data from server
    fetchGroups() {
        fetch('GroupsData', {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => response.json())
            .then(data => {
                this.groups = data;
                this.renderGroups(this.groups);
                this.isGroupsLoaded = true;
            });
    }

    // Renders contact list to the DOM
    renderContacts(contacts) {
        const allContacts = this.contactsContainer.querySelectorAll('.contact_box');
        allContacts.forEach(contact => contact.classList.remove('active'));

        this.contactsContainer.innerHTML = contacts.map(contact => {
            const image = contact.profileImage || 'images/default-profile.jpg';
            const msgCountDiv = contact.unreadCount > 0 ? `<div class="msg_count">${contact.unreadCount}</div>` : '';
            return `
                <div class="contact_box" data-user-id="${contact.userId}">
                    <img src="${image}" alt="${contact.userName}_image" class="contact-avatar">
                    <div class="contact-info">
                        <div class="contact-name">${contact.userName}</div>
                        ${msgCountDiv}
                    </div>
                </div>`;
        }).join('');
    }

    // Renders group list to the DOM
    renderGroups(groups) {
        this.contactsContainer.innerHTML = groups.map(group => {
            const image = group.groupImage || 'images/default-group1.jpg';
            const msgCountDiv = group.unreadCount > 0 ? `<div class="msg_count">${group.unreadCount}</div>` : '';
            return `
                <div class="group_box" data-group-id="${group.groupId}">
                    <img src="${image}" alt="${group.groupName}_image" class="group-avatar">
                    <div class="group-info">
                        <div class="group-name">${group.groupName}</div>
                        ${msgCountDiv}
                    </div>
                </div>`;
        }).join('');
    }

    // Sets a contact as active in the UI
    setActiveContact(selectedUserId) {
        const allContacts = this.contactsContainer.querySelectorAll('.contact_box');
        allContacts.forEach(contact => contact.classList.remove('active'));
        const activeContact = this.contactsContainer.querySelector(`[data-user-id="${selectedUserId}"]`);
        if (activeContact) activeContact.classList.add('active');
    }

    // Sets a group as active in the UI
    setActiveGroup(selectedGroupId) {
        const allGroups = this.contactsContainer.querySelectorAll('.group_box');
        allGroups.forEach(group => group.classList.remove('active'));
        const activeGroup = this.contactsContainer.querySelector(`[data-group-id="${selectedGroupId}"]`);
        if (activeGroup) activeGroup.classList.add('active');
    }

    // Removes unread message count from a contact
    unreadRemover(contact) {
        contact.unreadCount = 0;
        this.renderContacts(this.contacts);
    }

    // Initiates a new chat with a user
    newMessage(userId) {
        this.newUserId = userId;
        this.receiverId = userId;

        if (this.contacts.length === 0) {
            const checkInterval = setInterval(() => {
                if (this.isContactsLoaded) {
                    clearInterval(checkInterval);
                    const existingContact = this.contacts.find(contact => contact.userId === userId);
                    if (existingContact) {
                        this.contact = existingContact;
                        this.handleNewChatSetup(userId);
                    } else {
                        this.fetchNewContact(userId);
                    }
                }
            }, 100);
        }
    }

    // Fetches new contact data from server
    fetchNewContact(userId) {
        fetch('getNewChat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiverId: userId })
        })
            .then(response => response.json())
            .then(data => {
                this.contact = data;
                this.contacts.push(this.contact);
                this.renderContacts(this.contacts);
                this.handleNewChatSetup(userId);
            })
            .catch(error => console.error("Error adding new contact: ", error));
    }

    // Sets up UI for new chat
    handleNewChatSetup(userId) {
        this.hideChatImage();
        this.updateChatHeader(this.contact);
        this.messagesContainer.innerHTML = '';
        this.fetchOldMessages(this.currentUser.userId, userId);
        this.setActiveContact(userId);
    }

    // === Messaging Methods ===

    // Sends a text message via WebSocket
    sendMessage() {
        const message = this.textbox.value.trim();
        if (!message) return;

        this.textbox.value = "";
        this.displaySentMessage(message);

        const messageData = {
            senderId: this.currentUser.userId,
            content: message,
            receiverId: this.receiverId,
            groupId: this.groupId,
            messageType: 'TEXT'
        };
        if(this.clientSocket.CLOSED){
			this.clientSocket.OPEN
		}

        this.clientSocket.send(JSON.stringify(messageData));
        this.scrollToBottom();
    }


    async sendFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result; // Base64 string
            const messageData = {
                senderId: this.currentUser.userId,
                receiverId: this.receiverId,
                groupId: this.groupId || "",
                content: fileContent,
                fileName: file.name,
                messageType: "file"
            };
            console.log(messageData);
            this.clientSocket.send(JSON.stringify(messageData));
            this.displaySentFile(file.name, fileContent); // Pass fileContent
        };
        reader.readAsDataURL(file); // Keep as DataURL
    }

    // Fetches and displays old messages between users
    fetchOldMessages(senderId, receiverId) {
        fetch('GetMessages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId, receiverId })
        })
            .then(response => response.json())
            .then(data => this.displayOldMessages(data));
    }

    // Fetches and displays old group messages
    fetchGroupMessages(userId, groupId) {
        fetch('GetGroupMessages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: userId, groupId: groupId })
        })
            .then(response => response.json())
            .then(data => this.displayOldMessages(data));
    }

    // Displays sent text message in UI
    displaySentMessage(message) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("sendMessage", "message");
        const messageContent = document.createElement("div");
        messageContent.classList.add("sender_content");
        messageContent.textContent = message;
        messageDiv.appendChild(messageContent);
        this.messagesContainer.appendChild(messageDiv);
    }

    displaySentFile(fileName, fileContent) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("sendMessage", "message");

        const fileContainer = document.createElement("div");
        fileContainer.classList.add("file-container");

        const fileLink = document.createElement("a");
        fileLink.textContent = fileName;
        fileLink.classList.add("file-link");
        fileLink.style.cursor = "pointer";

        const contentDiv = document.createElement("pre");
        contentDiv.classList.add("file-content");
        contentDiv.style.display = "none"; // Hidden by default
        contentDiv.style.background = "#f5f5f5";
        contentDiv.style.padding = "10px";
        contentDiv.style.border = "1px solid #ddd";
        contentDiv.style.maxHeight = "300px";
        contentDiv.style.overflowY = "auto";

        // Decode Base64 content
        const base64Data = fileContent.split(',')[1];
        const decodedContent = atob(base64Data);
        contentDiv.textContent = decodedContent;

        // Toggle preview on click
        fileLink.addEventListener("click", () => {
            if (contentDiv.style.display === "none") {
                contentDiv.style.display = "block";
            } else {
                contentDiv.style.display = "none";
            }
            this.scrollToBottom();
        });

        fileContainer.appendChild(fileLink);
        fileContainer.appendChild(contentDiv);
        messageDiv.appendChild(fileContainer);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    downloadFile(fileName, fileContent) {
        // Extract the Base64 data (remove "data:*/*;base64," prefix)
        const base64Data = fileContent.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Create Blob based on file extension
        const mimeType = fileName.endsWith('.java') || fileName.endsWith('.js') ? 'text/plain' : 'application/octet-stream';
        const blob = new Blob([byteArray], { type: mimeType });

        // Create temporary URL and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url); // Clean up
    }

    // Displays received message (text or image)
    displayReceivedMessage(messageData) {
        if (!messageData.content) return;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", "receiveMessage");

        if (messageData.messageType === "image") {
            const imageElement = document.createElement("img");
            imageElement.src = messageData.content;
            imageElement.alt = messageData.fileName;
            imageElement.classList.add("received-image");
            messageDiv.appendChild(imageElement);
        } else if (messageData.messageType === "file") {
			console.log(messageData)
            const fileContainer = document.createElement("div");
            fileContainer.classList.add("file-container");

            const fileLink = document.createElement("a");
            fileLink.textContent = messageData.fileName;
            fileLink.classList.add("file-link");
            fileLink.style.cursor = "pointer";

            const contentDiv = document.createElement("pre");
            contentDiv.classList.add("file-content");
            contentDiv.style.display = "none"; // Hidden by default
            contentDiv.style.background = "#f5f5f5";
            contentDiv.style.padding = "10px";
            contentDiv.style.border = "1px solid #ddd";
            contentDiv.style.maxHeight = "300px";
            contentDiv.style.overflowY = "auto";

            // Decode Base64 content
            const base64Data = messageData.content.split(',')[1];
            const decodedContent = atob(base64Data);
            contentDiv.textContent = decodedContent;
            fileLink.addEventListener("click", () => {
                if (contentDiv.style.display === "none") {
                    contentDiv.style.display = "block";
                } else {
                    contentDiv.style.display = "none";
                }
                this.scrollToBottom();
            });

            fileContainer.appendChild(fileLink);
            fileContainer.appendChild(contentDiv);
            messageDiv.appendChild(fileContainer);
        } else {
            const MessageBox = document.createElement("div");
            MessageBox.classList.add("messageBox");
            const profile = document.createElement("img");
            profile.classList.add("chatImage");

            let senderContact = this.contacts.find(c => String(c.userId) === String(messageData.senderId));
            if (!senderContact && this.groupId) {
                const currentGroup = this.groups.find(g => String(g.groupId) === String(this.groupId));
                if (currentGroup && currentGroup.members) {
                    senderContact = currentGroup.members.find(m => String(m.userId) === String(messageData.senderId));
                }
            }

            profile.src = senderContact?.profileImage || 'images/default-profile.jpg';
            const senderName = senderContact?.userName || `member_${messageData.senderId}`;
            MessageBox.innerHTML = `<span style="font-weight:900;">${senderName}</span>`;

            const messageContent = document.createElement("p");
            messageContent.classList.add("receiver_content");
            messageContent.textContent = messageData.content;
            MessageBox.appendChild(messageContent);

            messageDiv.appendChild(profile);
            messageDiv.appendChild(MessageBox);
        }
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // Displays previous messages from conversation history
    displayOldMessages(messages) {
        messages.forEach(msg => {
            const messageDiv = document.createElement("div");
            const isSender = Number(msg.senderId) === Number(this.currentUser.userId);
            messageDiv.classList.add(isSender ? "sendMessage" : "receiveMessage", "message");
            this.messageContent = document.createElement("p");

            if (msg.messageType === "image") {
                const imageElement = document.createElement("img");
                imageElement.src = msg.content;
                imageElement.alt = msg.fileName;
                imageElement.classList.add("received-image");
                messageDiv.appendChild(imageElement);
            } else {
                this.messageContent.classList.add(isSender ? "sender_content" : "receiver_content");
                this.messageContent.textContent = msg.message || msg.content;
            }

            if (!isSender) {
                const profile = document.createElement("img");
                profile.classList.add("profile");
                const senderContact = this.contacts.find(c => String(c.userId) === String(msg.senderId));
                profile.src = senderContact?.profileImage || 'images/default-profile.jpg';
                messageDiv.appendChild(profile);
            }
            messageDiv.appendChild(this.messageContent);


            this.messagesContainer.prepend(messageDiv);
        });
        this.scrollToBottom();
    }

    // Sends an image message
    sendImage(base64Image, fileName, fileType) {
        const imageMessageData = {
            senderId: this.currentUser.userId,
            receiverId: this.receiverId,
            content: base64Image,
            fileName,
            fileType,
            messageType: "image"
        };
        this.clientSocket.send(JSON.stringify(imageMessageData));
        this.displaySentImage(base64Image, fileName, fileType);
    }

    // Displays sent image in UI
    displaySentImage(base64Image, fileName, fileType) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("sendMessage", "message");
        const imageElement = document.createElement("img");
        imageElement.src = base64Image;
        imageElement.alt = fileName;
        imageElement.classList.add("sent-image");
        messageDiv.appendChild(imageElement);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // === Event Handler Methods ===

    // Handles clicks on contacts or groups
    handleContactClick(event) {
        const targetItem = event.target.closest('.contact_box') || event.target.closest('.group_box');
        if (!targetItem) return;

        this.hideChatImage();

        if (targetItem.classList.contains('contact_box')) {
            this.userId = targetItem.getAttribute('data-user-id');
            this.contact = this.contacts.find(c => c.userId == this.userId);
            this.chatObject.senderId = this.userId;
            this.receiverId = this.userId;
            this.updateChatHeader(this.contact);
            this.unreadRemover(this.contact);
            this.setActiveContact(this.receiverId);
            this.messagesContainer.innerHTML = '';
            this.fetchOldMessages(this.currentUser.userId, this.userId);
        } else if (targetItem.classList.contains('group_box')) {
            this.groupId = targetItem.getAttribute('data-group-id');
            this.group = this.groups.find(g => g.groupId == this.groupId);
            this.chatObject.senderId = this.groupId;
            this.receiverId = this.groupId;
            this.updateChatHeader(this.group);
            this.setActiveGroup(this.groupId);
            this.messagesContainer.innerHTML = '';
            this.fetchGroupMessages(this.currentUser.userId, this.groupId);
        }
    }

    // Handles search input filtering
    handleSearchInput(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredContacts = this.contacts.filter(contact =>
            contact.userName.toLowerCase().includes(searchTerm) ||
            contact.teamName.toLowerCase().includes(searchTerm)
        );
        const filteredGroups = this.groups.filter(group =>
            group.groupName.toLowerCase().includes(searchTerm)
        );

        if (document.getElementById('users_tab').classList.contains('active')) {
            this.renderContacts(filteredContacts);
        } else {
            this.renderGroups(filteredGroups);
        }
    }

    // Handles file selection for image upload
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.name.endsWith('.java') || file.name.endsWith('.js') ||  file.name.endsWith('.txt') || file.name.endsWith('.css') || file.name.endsWith('.html')) {
                this.sendFile(); 
            } else if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Image = e.target.result;
                    this.sendImage(base64Image, file.name, file.type);
                };
                reader.readAsDataURL(file);
            } else {
                alert("Please select an image, .java, .html, .txt, .css or .js file.");
            }
        }
    }

    // === Utility Methods ===

    // Scrolls chat window to bottom
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 50);
    }
}
