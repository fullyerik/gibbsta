   // Keyboard Navigation (optional)
    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case '1':
                showSectionByIndex(0); // Feed
                break;
            case '2':
                showSectionByIndex(1); // Chat
                break;
            case '3':
                showSectionByIndex(2); // Profile
                break;
        }
    });
});

// Hilfsfunktion für Keyboard Navigation
function showSectionByIndex(index) {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems[index]) {
        navItems[index].click();
    }
}

// Weitere Funktionen können hier hinzugefügt werden
function addNewPost(imageUrl, caption, author) {
    // Funktion um neue Posts hinzuzufügen
    // Wird später für echte Funktionalität verwendet
    console.log('Neuer Post würde hier hinzugefügt:', { imageUrl, caption, author });
}

function sendMessage(recipient, message) {
    // Funktion um Nachrichten zu senden
    // Wird später für echte Chat-Funktionalität verwendet
    console.log('Nachricht würde gesendet:', { recipient, message });
}
