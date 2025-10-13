document.addEventListener('DOMContentLoaded', function() {
  const imagePreview = document.getElementById('imagePreview');
  const imageInput = document.getElementById('imageInput');
  const captionInput = document.getElementById('captionInput');
  const charCount = document.getElementById('charCount');
  
  // Klick → Datei öffnen
  imagePreview.addEventListener('click', () => imageInput.click());

  // Drag & Drop
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
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  });

  // Datei ausgewählt
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  });

  // Zeichen zählen
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

// Vorschau rendern
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

// SUPABASE: Bild hochladen + Post speichern
async function createPost() {
  const imagePreview = document.getElementById('imagePreview');
  const caption = document.getElementById('captionInput').value.trim();
  const currentUser = await sbUser();

  if (!imagePreview.querySelector('img')) { alert('Bitte wähle ein Bild aus!'); return; }
  if (!currentUser) { alert('Bitte zuerst einloggen.'); window.location.href = 'index.html'; return; }

  const file = document.getElementById('imageInput').files?.[0];
  if (!file) { alert('Fehler: Datei nicht gefunden. Bitte Bild erneut wählen.'); return; }

  // 1) Upload in Storage
  const fileName = `${currentUser.id}/${Date.now()}_${file.name}`;
  const { error: upErr } = await sb.storage.from('images').upload(fileName, file, {
    cacheControl: '3600', upsert: false
  });
  if (upErr) { alert(upErr.message); return; }

  // 2) Datensatz in posts
  const { error: dbErr } = await sb.from('posts').insert({
    user_id: currentUser.id, image_path: fileName, caption
  });
  if (dbErr) { alert(dbErr.message); return; }

  alert('Beitrag wurde erfolgreich erstellt!');
  window.location.href = 'homepage.html';
}
