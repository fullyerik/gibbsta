// App State Management
const appState = {
    currentUser: {
        id: 'user123',
        name: 'Jan Schneider',
        avatar: 'JS',
        class: 'Informatik',
        year: '2. Lehrjahr'
    },
    posts: [],
    chats: [],
    stories: [],
    notifications: []
};

// Sample Data
const samplePosts = [
    {
        id: 1,
        user: { name: 'Max Schüler', avatar: 'MS', class: 'Informatik' },
        timestamp: '2 Stunden',
        image: '🖼️ Programmier-Setup',
        caption: 'Endlich Pause! Das Programmieren heute war echt anstrengend 😅 #gibb #informatik',
        likes: 12,
        comments: 3,
        liked: false
    },
    {
        id: 2,
        user: { name: 'Lisa Müller', avatar: 'LM', class: 'KV' },
        timestamp: '4 Stunden',
        image: '📚 Bücher und Notizen',
        caption: 'Lernen für die Prüfung morgen... Wer noch? 📖 #prüfung #gibb',
        likes: 8,
        comments: 1,
        liked: false
    },
    {
        id: 3,
        user: { name: 'Anna Schmidt', avatar: 'AS', class: 'Detailhandel' },
        timestamp: '6 Stunden',
        image: '☕ Kaffeepause',
        caption: 'Pause zwischen den Vorlesungen ☕ Die GIBB-Cafeteria macht echt guten Kaffee!',
        likes: 15,
        comments: 7,
        liked: true
    }
];

const sampleChats = [
    {
        id: 1,
        user: { name: 'Max Schüler', avatar: 'MS' },
        lastMessage: 'Hey, hast du die Hausaufgaben gemacht?',
        timestamp: '14:32',
        unread: 2,
        online: true
    },
    {
        id: 2,
        user: { name: 'Informatik Klasse', avatar: '👥' },
        lastMessage: 'Lisa: Wann ist nochmal die Abgabe?',
        timestamp: '13:45',
        unread: 0,
        online: false,
        isGroup: true
    },
    {
        id: 3,
        user: { name: 'Anna Schmidt', avatar: 'AS' },
        lastMessage: 'Danke für deine Hilfe! 😊',
        timestamp: '12:18',
        unread: 0,
        online: false
    },
    {
        id: 4,
        user: { name: 'Tom Weber', avatar: 'TW' },
        lastMessage: 'Sehen wir uns heute noch?',
        timestamp: '11:45',
        unread: 1,
        online: true
    }
];

const sampleMessages = {
    1: [
        { id: 1, sender: 'Max Schüler', text: 'Hey Jan!', timestamp: '14:30', own: false },
        { id: 2, sender: 'Jan Schneider', text: 'Hi Max! Wie gehts?', timestamp: '14:31', own: true },
        { id: 3, sender: 'Max Schüler', text: 'Gut! Hast du die Hausaufgaben gemacht?', timestamp: '14:32', own: false },
        { id: 4, sender: 'Jan Schneider', text: 'Ja, war nicht so schwer 😊', timestamp: '14:33', own: true }
    ]
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Gibbsta App gestartet!');
    
    // Load initial data
    appState.posts = [...samplePosts];
    appState.chats = [...sampleChats];
    
    // Render initial content
    renderPosts();
    renderChats();
    renderProfileGrid();
    
    // Setup event listeners
    setupEventListeners();
    
    showNotification('Willkommen bei Gibbsta! 🎓', 'success');
});

// Event Listeners Setup
function setupEventListeners() {
    // Post input validation
    const postTextArea = document.getElementById('postText');
    if (postTextArea) {
        postTextArea.addEventListener('input', validatePostButton);
    }
    
    // Message input enter key
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            const sendBtn = document.querySelector('.chat-send-btn');
            if (this.value.trim()) {
                sendBtn.style.color = 'var(--primary-color)';
            } else {
                sendBtn.style.color = 'var(--gray-500)';
            }
        });
    }
    
    // Close modals on outside click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Load section-specific content
    switch(sectionName) {
        case 'feed':
            renderPosts();
            break;
        case 'chat':
            renderChats();
            break;
        case 'profile':
            renderProfileGrid();
            break;
        case 'explore':
            showNotification('Entdecken-Feature kommt bald! 🔍', 'info');
            break;
    }
}

// Posts Management
function renderPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    appState.posts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postDiv = document.createElement('article');
    postDiv.className = 'post';
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-user-info">
                <div class="profile-pic">${post.user.avatar}</div>
                <div class="post-info">
                    <h4>${post.user.name}</h4>
                    <p>${post.user.class} • vor ${post.timestamp}</p>
                </div>
            </div>
            <button class="post-menu-btn" onclick="showPostMenu(${post.id})">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>
        <div class="post-image">${post.image}</div>
        <div class="post-actions">
            <div class="action-left">
                <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="toggleLike(this, ${post.id})">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes}</span>
                </button>
                <button class="action-btn" onclick="showComments(${post.id})">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments}</span>
                </button>
                <button class="action-btn" onclick="sharePost(${post.id})">
                    <i class="fas fa-share"></i>
                </button>
            </div>
            <button class="action-btn" onclick="savePost(${post.id})">
                <i class="far fa-bookmark"></i>
            </button>
        </div>
        <div class="post-caption">${post.caption}</div>
        <div class="post-stats">
            Gefällt ${post.likes} Personen • ${post.comments} Kommentare
        </div>
    `;
    
    return postDiv;
}

function toggleLike(button, postId) {
    const post = appState.posts.find(p => p.id === postId);
    if (!post) return;
    
    const likeCount = button.querySelector('span');
    let count = parseInt(likeCount.textContent);
    
    if (button.classList.contains('liked')) {
        // Unlike
        button.classList.remove('liked');
        post.likes = count - 1;
        post.liked = false;
        likeCount.textContent = post.likes;
        showNotification('Like entfernt', 'info');
    } else {
        // Like
        button.classList.add('liked');
        post.likes = count + 1;
        post.liked = true;
        likeCount.textContent = post.likes;
        showNotification('Post geliked! ❤️', 'success');
        
        // Animate button
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
}

function showComments(postId) {
    showNotification('Kommentar-System wird geladen...', 'info');
    // Hier würde das Kommentar-Modal geöffnet werden
}

function sharePost(postId) {
    showNotification('Post geteilt! 📤', 'success');
}

function savePost(postId) {
    const button = event.target.closest('.action-btn');
    const icon = button.querySelector('i');
    
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        showNotification('Post gespeichert! 📌', 'success');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        showNotification('Speicherung entfernt', 'info');
    }
}

function showPostMenu(postId) {
    showNotification('Post-Menü geöffnet', 'info');
}

// Post Creation
function openPostModal(type = 'text') {
    const modal = document.getElementById('postModal');
    modal.classList.add('active');
    modal.style.display = 'flex';
    
    const textarea = document.getElementById('postText');
    textarea.focus();
    
    if (type === 'photo') {
        addImage();
    } else if (type === 'feeling') {
        addFeeling();
    } else if (type === 'location') {
        addLocation();
    }
}

function validatePostButton() {
    const textarea = document.getElementById('postText');
    const publishBtn = document.getElementById('publishBtn');
    
    if (textarea.value.trim().length > 0) {
        publishBtn.disabled = false;
        publishBtn.style.opacity = '1';
    } else {
        publishBtn.disabled = true;
        publishBtn.style.opacity = '0.5';
    }
}

function addImage() {
    const preview = document.getElementById('imagePreview');
    preview.style.display = 'flex';
    preview.innerHTML = '📸 Bild wird hier angezeigt';
    preview.classList.add('has-image');
    showNotification('Bild hinzugefügt! 📷', 'success');
    validatePostButton();
}

function addLocation() {
    const textarea = document.getElementById('postText');
    textarea.value += ' 📍 GIBB Bern';
    showNotification('Standort hinzugefügt! 📍', 'success');
    validatePostButton();
}

function addFeeling() {
    const textarea = document.getElementById('postText');
    textarea.value += ' 😊 fühlt sich glücklich';
    showNotification('Gefühl hinzugefügt! 😊', 'success');
    validatePostButton();
}

function publishPost() {
    const textarea = document.getElementById('postText');
    const privacy = document.getElementById('postPrivacy').value;
    
    if (!textarea.value.trim()) return;
    
    showLoading(true);
    
    setTimeout(() => {
        const newPost = {
            id: Date.now(),
            user: appState.currentUser,
            timestamp: 'gerade eben',
            image: '🆕 Neuer Post',
            caption: textarea.value,
            likes: 0,
            comments: 0,
            liked: false
        };
        
        appState.posts.unshift(newPost);
        renderPosts();
        closeModal('postModal');
        
        // Reset form
        textarea.value = '';
        document.getElementById('imagePreview').style.display = 'none';
        
        showLoading(false);
        showNotification('Post erfolgreich veröffentlicht! 🎉', 'success');
    }, 1500);
}

// Chat Management
function renderChats() {
    const container = document.getElementById('chatList');
    if (!container) return;
    
    container.innerHTML = '';
    
    appState.chats.forEach(chat => {
        const chatElement = createChatElement(chat);
        container.appendChild(chatElement);
    });
}

function createChatElement(chat) {
    const chatDiv = document.createElement('div');
    chatDiv.className = 'chat-item';
    chatDiv.onclick = () => openChat(chat.id);
    
    const unreadBadge = chat.unread > 0 ? `<div class="nav-notification">${chat.unread}</div>` : '';
    const onlineIndicator = chat.online ? '🟢' : '';
    
    chatDiv.innerHTML = `
        <div class="profile-pic">${chat.user.avatar}</div>
        <div class="chat-info">
            <h4>${chat.user.name} ${onlineIndicator}</h4>
            <p>${chat.lastMessage}</p>
        </div>
        <div class="chat-time">${chat.timestamp}</div>
        ${unreadBadge}
    `;
    
    return chatDiv;
}

function searchChats() {
    const searchTerm = document.getElementById('chatSearch').value.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const userName = item.querySelector('h4').textContent.toLowerCase();
        if (userName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function newChat() {
    showNotification('Neuer Chat wird erstellt...', 'info');
    // Hier würde eine Benutzerliste zum Auswählen angezeigt
}

function openChat(chatId) {
    const chat = appState.chats.find(c => c.id === chatId);
    if (!chat) return;
    
    // Update chat modal
    document.getElementById('chatUserPic').textContent = chat.user.avatar;
    document.getElementById('chatUserName').textContent = chat.user.name;
    
    // Load messages
    loadChatMessages(chatId);
    
    // Open modal
    const modal = document.getElementById('chatModal');
    modal.classList.add('active');
    modal.style.display = 'flex';
    
    // Mark as read
    chat.unread = 0;
    renderChats();
}

function loadChatMessages(chatId) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    
    const messages = sampleMessages[chatId] || [];
    
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.own ? 'own' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <p>${message.text}</p>
            <div class="message-time">${message.timestamp}</div>
        </div>
    `;
    
    return messageDiv;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const newMessage = {
        id: Date.now(),
        sender: appState.currentUser.name,
        text: text,
        timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        own: true
    };
    
    // Add to current chat
    const currentChatId = 1; // Vereinfacht für Demo
    if (!sampleMessages[currentChatId]) {
        sampleMessages[currentChatId] = [];
    }
    sampleMessages[currentChatId].push(newMessage);
    
    // Update UI
    const messageElement = createMessageElement(newMessage);
    document.getElementById('chatMessages').appendChild(messageElement);
    
    // Clear input
    input.value = '';
    
    // Scroll to bottom
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
    
    // Simulate response (Demo)
    setTimeout(() => {
        const response = {
            id: Date.now() + 1,
            sender: 'Max Schüler',
            text: 'Super, danke! 😊',
            timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            own: false
        };
        
        sampleMessages[currentChatId].push(response);
        const responseElement = createMessageElement(response);
        document.getElementById('chatMessages').appendChild(responseElement);
        container.scrollTop = container.scrollHeight;
    }, 2000);
}

function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function callUser() {
    showNotification('Anruf wird gestartet... 📞', 'info');
}

function videoCall() {
    showNotification('Videoanruf wird gestartet... 📹', 'info');
}

function attachFile() {
    showNotification('Datei-Auswahl wird geöffnet... 📎', 'info');
}

function openEmojiPicker() {
    const input = document.getElementById('messageInput');
    const emojis = ['😀', '😂', '❤️', '👍', '👏', '🔥', '💯', '🎉'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    input.value += randomEmoji;
    input.focus();
}

// Profile Management
function renderProfileGrid() {
    const container = document.getElementById('profileGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Sample profile posts
    for (let i = 1; i <= 12; i++) {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.innerHTML = `📷`;
        gridItem.onclick = () => showNotification(`Post ${i} geöffnet`, 'info');
        container.appendChild(gridItem);
    }
}

function showProfileTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update content based on tab
    const container = document.getElementById('profileGrid');
    container.innerHTML = '';
    
    switch(tabName) {
        case 'posts':
            renderProfileGrid();
            break;
        case 'saved':
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray-500);">Keine gespeicherten Posts</p>';
            break;
        case 'tagged':
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray-500);">Keine markierten Posts</p>';
            break;
    }
}

function editProfile() {
    showNotification('Profil-Editor wird geladen...', 'info');
}

function shareProfile() {
    showNotification('Profil wird geteilt...', 'success');
}

function changeProfilePic() {
    showNotification('Profilbild-Auswahl wird geladen...', 'info');
}

function editCover() {
    showNotification('Titelbild-Editor wird geladen...', 'info');
}

function showPosts() {
    showProfileTab('posts');
}

function showFollowers() {
    showNotification('Follower-Liste wird geladen...', 'info');
}

function showFollowing() {
    showNotification('Following-Liste wird geladen...', 'info');
}

// Stories Management
function addStory() {
    showNotification('Story-Creator wird geladen...', 'info');
}

function viewStory(storyId) {
    showNotification(`Story von ${storyId} wird geladen...`, 'info');
}

// Header Actions
function openMessages() {
    showSection('chat');
}

function openNotifications() {
    showNotification('Du hast 5 neue Benachrichtigungen! 🔔', 'info');
}

function openSettings() {
    showNotification('Einstellungen werden geladen...', 'info');
}

// Modal Management
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
}

// Notifications System
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const toast = notification.querySelector('.toast-content');
    const icon = toast.querySelector('.toast-icon');
    const messageSpan = toast.querySelector('.toast-message');
    
    // Set content
    messageSpan.textContent = message;
    
    // Set icon based on type
    let iconClass = 'fas fa-check-circle';
    let borderColor = 'var(--success-color)';
    
    switch(type) {
        case 'error':
            iconClass = 'fas fa-exclamation-circle';
            borderColor = 'var(--danger-color)';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            borderColor = 'var(--warning-color)';
            break;
        case 'info':
            iconClass = 'fas fa-info-circle';
            borderColor = 'var(--primary-color)';
            break;
    }
    
    icon.className = `toast-icon ${iconClass}`;
    notification.style.borderLeftColor = borderColor;
    
    // Show notification
    notification.style.display = 'block';
    notification.style.animation = 'slideInRight 0.3s ease-out';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

// Loading Management
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.style.display = 'flex';
    } else {
        loading.style.display = 'none';
    }
}

// Utility Functions
function formatTime(date) {
    return new Date(date).toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Performance Optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add debounced search
const debouncedSearch = debounce(searchChats, 300);
if (document.getElementById('chatSearch')) {
    document.getElementById('chatSearch').addEventListener('input', debouncedSearch);
}

// Service Worker Registration (für PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Nur wenn kein Input fokussiert ist
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(e.key) {
        case '1':
            showSection('feed');
            break;
        case '2':
            showSection('explore');
            break;
        case '3':
            openPostModal();
            break;
        case '4':
            showSection('chat');
            break;
        case '5':
            showSection('profile');
            break;
        case 'n':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                openPostModal();
            }
            break;
    }
});

// Touch Gestures (vereinfacht)
let startY = 0;
let currentSection = 'feed';

document.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    const endY = e.changedTouches[0].clientY;
    const diff = startY - endY;
    
    // Pull to refresh (nach unten wischen)
    if (diff < -100 && window.scrollY === 0) {
        refreshFeed();
    }
});

function refreshFeed() {
    showLoading(true);
    setTimeout(() => {
        renderPosts();
        showLoading(false);
        showNotification('Feed aktualisiert! 🔄', 'success');
    }, 1500);
}

// Export für Testing (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        appState,
        showSection,
        toggleLike,
        sendMessage,
        showNotification
    };
}

console.log('🎉 Gibbsta Advanced App bereit!');