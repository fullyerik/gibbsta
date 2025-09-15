document.addEventListener('DOMContentLoaded', function() {
    const imagePreview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('imageInput');
    const captionInput = document.getElementById('captionInput');
    const charCount = document.getElementById('charCount');
    
    // Bild-Upload durch Klick
    imagePreview.addEventListener('click', () => {
        imageInput.click();
    });

    // Drag & Drop Funktionalität
    imagePreview.addEventListener('dragover', (e) => {
        e.preventDefault();
        imagePreview.style.borderColor = '#0095f6';
        imagePreview.style.backgroundColor = 'rgba(0,149,246,0.1)';
    });

    imagePreview.addEventListener('dragleave', () => {
        imagePreview.style.borderColor = '#dbdbdb';
        imagePreview.style.backgroundColor = 'transparent';
    });

    imagePreview.addEventListener('drop', (e) => {
        e.preventDefault();
        imagePreview.style.borderColor = '#dbdbdb';
        imagePreview.style.backgroundColor = 'transparent';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    // Bild-Upload Handler
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });

    // Zeichen-Zähler für Beschreibung
    captionInput.addEventListener('input', () => {
        const length = captionInput.value.length;
        charCount.textContent = `${length}/2200`;
        
        if (length > 2200) {
            charCount.style.color = 'red';
            captionInput.value = captionInput.value.slice(0, 2200);
        } else {
            charCount.style.color = '#8e8e8e';
        }
    });
});

// Funktion zum Anzeigen des ausgewählten Bildes
function handleImageUpload(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Vorschau">`;
        };
        reader.readAsDataURL(file);
    }
}

// Funktion zum Erstellen des Posts
function createPost() {
    const imagePreview = document.getElementById('imagePreview');
    const caption = document.getElementById('captionInput').value;
    
    // Prüfe ob ein Bild ausgewählt wurde
    if (!imagePreview.querySelector('img')) {
        alert('Bitte wähle ein Bild aus!');
        return;
    }

    // Hole das Bild als Base64-String
    const imageData = imagePreview.querySelector('img').src;
    
    // Hole existierende Posts aus dem localStorage oder erstelle leeres Array
    let posts = JSON.parse(localStorage.getItem('posts') || '[]');
    
    // Erstelle neuen Post
    const newPost = {
        id: Date.now(),
        username: JSON.parse(sessionStorage.getItem('currentUser')).username,
        image: imageData,
        caption: caption,
        date: new Date().toISOString(),
        likes: 0
    };
    
    // Füge neuen Post am Anfang des Arrays hinzu
    posts.unshift(newPost);
    
    // Speichere aktualisierte Posts
    localStorage.setItem('posts', JSON.stringify(posts));
    
    alert('Beitrag wurde erfolgreich erstellt!');
    window.location.href = 'homepage.html';
}