document.addEventListener('DOMContentLoaded', function() {
    // Feed Toggle Buttons
    const feedToggles = document.querySelectorAll('.feed-toggle');
    feedToggles.forEach(button => {
        button.addEventListener('click', function() {
            feedToggles.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Profile Button Navigation
    document.getElementById('profileButton').addEventListener('click', function() {
        window.location.href = 'homepage.html';
    });

    // Update Bottom Navigation to handle active states
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Check which button was clicked and navigate accordingly
            if (this.querySelector('.fa-home')) {
                window.location.href = 'home.html';
            } else if (this.querySelector('.fa-user')) {
                window.location.href = 'homepage.html';
            }
            // Add other navigation cases as needed
        });
    });

    // Like Button Functionality
    document.querySelectorAll('.post-actions button:first-child').forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#ed4956';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = '';
            }
        });
    });

    // Save Post Functionality
    document.querySelectorAll('.save-post').forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        });
    });
});

// Temporäre Beispieldaten (später durch Datenbankabfragen ersetzen)
const mockUsers = [
    { username: 'erik_admin', name: 'Erik Admin', isVerified: true },
    { username: 'lars_admin', name: 'Lars Admin', isVerified: true },
    { username: 'enes_admin', name: 'Enes Admin', isVerified: true },
    { username: 'test_user1', name: 'Test User', isVerified: false }
];

const mockPosts = [
    { id: 1, username: 'erik_admin', caption: 'Erster Post auf Gibbsta! #start' },
    { id: 2, username: 'lars_admin', caption: 'Toller Tag bei Gibbsta #awesome' }
];

let activeSearchTab = 'accounts';

function openSearchModal() {
    document.getElementById('searchModal').classList.remove('hidden');
    document.getElementById('searchInput').focus();
}

function closeSearchModal() {
    document.getElementById('searchModal').classList.add('hidden');
}

function switchSearchTab(tab) {
    activeSearchTab = tab;
    document.querySelectorAll('.search-tab').forEach(t => {
        t.classList.toggle('active', t.innerText.toLowerCase() === tab);
    });
    handleSearch();
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    if (searchTerm.length < 1) return;

    if (activeSearchTab === 'accounts') {
        const filteredUsers = mockUsers.filter(user => 
            user.username.toLowerCase().includes(searchTerm) ||
            user.name.toLowerCase().includes(searchTerm)
        );

        filteredUsers.forEach(user => {
            resultsContainer.innerHTML += `
                <div class="search-result-item">
                    <img src="default-avatar.png" class="search-result-avatar">
                    <div class="search-result-info">
                        <div class="search-result-username">${user.username} ${user.isVerified ? '✓' : ''}</div>
                        <div class="search-result-name">${user.name}</div>
                    </div>
                </div>
            `;
        });
    } else {
        const filteredPosts = mockPosts.filter(post =>
            post.caption.toLowerCase().includes(searchTerm) ||
            post.username.toLowerCase().includes(searchTerm)
        );

        filteredPosts.forEach(post => {
            resultsContainer.innerHTML += `
                <div class="search-result-item">
                    <div class="search-result-info">
                        <div class="search-result-username">@${post.username}</div>
                        <div class="search-result-name">${post.caption}</div>
                    </div>
                </div>
            `;
        });
    }
}

// Event Listener für den Such-Button in der Bottom Navigation
document.querySelector('.nav-item .fa-search').parentElement.addEventListener('click', openSearchModal);