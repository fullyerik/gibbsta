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