// agb-script.js

// Funktion zum Zurückgehen zur index.html
function goBack() {
    // Prüfe ob es einen Verlauf gibt, sonst gehe zur index.html
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

// Smooth Scrolling für Anker-Links
document.addEventListener('DOMContentLoaded', function() {
    // Alle Links die mit # beginnen
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Scroll-to-Top Button (optional)
    createScrollToTopButton();
    
    // Highlight aktuelle Section beim Scrollen
    handleScrollHighlight();
});

// Scroll-to-Top Button erstellen
function createScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '↑';
    scrollButton.className = 'scroll-to-top';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background-color: #1877f2;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        display: none;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(scrollButton);
    
    // Button anzeigen/verstecken basierend auf Scroll-Position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollButton.style.display = 'block';
        } else {
            scrollButton.style.display = 'none';
        }
    });
    
    // Scroll to top Funktionalität
    scrollButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover-Effekt
    scrollButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#166fe5';
        this.style.transform = 'scale(1.1)';
    });
    
    scrollButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '#1877f2';
        this.style.transform = 'scale(1)';
    });
}

// Section Highlighting beim Scrollen
function handleScrollHighlight() {
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Entferne vorherige Highlights
                sections.forEach(s => s.style.backgroundColor = '');
                
                // Highlight aktuelle Section für kurze Zeit
                entry.target.style.transition = 'background-color 0.3s ease';
                entry.target.style.backgroundColor = 'rgba(24, 119, 242, 0.05)';
                
                // Entferne Highlight nach 2 Sekunden
                setTimeout(() => {
                    entry.target.style.backgroundColor = '';
                }, 2000);
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px'
    });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Keyboard Navigation
document.addEventListener('keydown', function(e) {
    // ESC Taste um zurück zu gehen
    if (e.key === 'Escape') {
        goBack();
    }
    
    // Strg/Cmd + P für Drucken
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
});

// Print-Funktion
function printDocument() {
    window.print();
}

// Text-zu-Sprache Funktion (optional)
function readAloud(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    } else {
        alert('Text-zu-Sprache wird in diesem Browser nicht unterstützt.');
    }
}

// Accessibility: Fokus-Management
document.addEventListener('DOMContentLoaded', function() {
    // Verbessere Fokus-Sichtbarkeit
    const focusableElements = document.querySelectorAll('a, button, [tabindex]');
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '3px solid #1877f2';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });
});

// Funktion zum Kopieren von Abschnitten (für einfache Referenz)
function copySection(sectionElement) {
    const text = sectionElement.innerText;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Abschnitt kopiert!');
        });
    } else {
        // Fallback für ältere Browser
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Abschnitt kopiert!');
    }
}

// Notification anzeigen
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4BB543;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 1001;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Animation CSS hinzufügen
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Notification nach 3 Sekunden entfernen
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Dark Mode Toggle (optional)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Dark Mode CSS (wird bei Bedarf hinzugefügt)
const darkModeCSS = `
    .dark-mode {
        background-color: #1a1a1a;
        color: #e0e0e0;
    }
    .dark-mode .container {
        background-color: #2d2d2d;
    }
    .dark-mode .meta-info {
        background-color: #3a3a3a;
    }
    .dark-mode .notice {
        background-color: #4a4a4a;
        border-color: #666;
    }
    .dark-mode section h2 {
        border-bottom-color: #555;
    }
`;

// Dark Mode laden falls gespeichert
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        // Dark Mode CSS hinzufügen
        const style = document.createElement('style');
        style.textContent = darkModeCSS;
        document.head.appendChild(style);
    }
});