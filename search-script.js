// Temporäre Mockdaten (später durch Datenbank ersetzen)
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

function goBack() {
    window.history.back();
}

function switchSearchTab(tab) {
    activeSearchTab = tab;
    document.querySelectorAll('.search-tab').forEach(t => {
        t.classList.remove('active');
        if (t.getAttribute('onclick').includes(tab)) {
            t.classList.add('active');
        }
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