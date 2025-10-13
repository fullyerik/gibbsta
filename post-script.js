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

async function createPost() {
  const imageEl = document.getElementById('imagePreview').querySelector('img');
  const caption = document.getElementById('captionInput').value.trim();

  if (!imageEl) { alert('Bitte wähle ein Bild aus!'); return; }

  const user = await sbUser();
  if (!user) { alert('Bitte zuerst einloggen.'); window.location.href = 'index.html'; return; }

  const fileInput = document.getElementById('imageInput');
  const file = fileInput.files?.[0];
  if (!file) { alert('Fehler: Datei nicht gefunden. Bitte Bild erneut wählen.'); return; }

  const filename = `${user.id}/${Date.now()}_${file.name}`;
  const { error: upErr } = await sb.storage.from('images').upload(filename, file, {
    cacheControl: '3600', upsert: false
  });
  if (upErr) { alert(upErr.message); return; }

  const { error: dbErr } = await sb.from('posts').insert({
    user_id: user.id, image_path: filename, caption
  });
  if (dbErr) { alert(dbErr.message); return; }

  alert('Beitrag wurde erfolgreich erstellt!');
  window.location.href = 'homepage.html';
}
