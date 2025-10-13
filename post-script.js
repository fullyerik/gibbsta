document.addEventListener('DOMContentLoaded', async function() {
  const params = new URLSearchParams(location.search);
  const postId = params.get('id');

  if (postId) {
    // === VIEWER-MODUS ===
    try { await renderPostView(postId); }
    catch (e) {
      console.error(e);
      alert('Post konnte nicht geladen werden.');
      // Fallback: zeige wieder den Upload
      initUploadUI();
    }
  } else {
    // === UPLOAD-MODUS (wie bisher) ===
    initUploadUI();
  }
});

function initUploadUI() {
  const imagePreview = document.getElementById('imagePreview');
  const imageInput = document.getElementById('imageInput');
  const captionInput = document.getElementById('captionInput');
  const charCount = document.getElementById('charCount');

  // UI-Elemente sichtbar machen (falls vom Viewer versteckt)
  showUploadSections(true);

  // Bild-Upload durch Klick
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
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
      // input-Element für späteren Upload befüllen
      const dt = new DataTransfer();
      dt.items.add(file);
      imageInput.files = dt.files;
    }
  });

  // File-Input
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  });

  // Zeichen-Zähler
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
}

// Vorschau des ausgewählten Bildes
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

  // Validierungen
  const ALLOWED = ['image/png','image/jpeg','image/webp'];
  const MAX_MB = 10;
  if (!ALLOWED.includes(file.type)) { alert('Nur PNG, JPEG oder WebP sind erlaubt.'); return; }
  if (file.size > MAX_MB*1024*1024) { alert('Bild ist zu groß (max. 10 MB).'); return; }

  const rawName  = file.name;
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g,'_');
  const imageName = safeName.replace(/\.[^.]+$/, ''); // ohne Endung
  const filepath = `${user.id}/${Date.now()}_${safeName}`;

  // Upload ins Storage
  const { error: upErr } = await sb.storage.from('images').upload(filepath, file, {
    cacheControl: '3600', upsert: false
  });
  if (upErr) { alert('Upload fehlgeschlagen: ' + upErr.message); return; }

  // Datensatz in posts
  const { data: inserted, error: dbErr } = await sb.from('posts')
    .insert({ user_id: user.id, image_path: filepath, caption, image_name: imageName })
    .select('id')
    .single();
  if (dbErr) {
    try { await sb.storage.from('images').remove([filepath]); } catch (_) {}
    alert('Beitrag konnte nicht gespeichert werden: ' + dbErr.message);
    return;
  }

  alert('Beitrag wurde erfolgreich erstellt!');
  // Nach erfolgreichem Post direkt in den Viewer springen:
  window.location.href = `post.html?id=${inserted.id}`;
}

// ========== VIEWER-MODUS ==========
function showUploadSections(show) {
  const up = document.querySelector('.upload-section');
  const cap = document.querySelector('.caption-section');
  const opts = document.querySelector('.post-options');
  if (up) up.style.display = show ? '' : 'none';
  if (cap) cap.style.display = show ? '' : 'none';
  if (opts) opts.style.display = show ? '' : 'none';
}

function ensureViewerHost() {
  let host = document.getElementById('post-viewer');
  if (!host) {
    host = document.createElement('div');
    host.id = 'post-viewer';
    host.style.maxWidth = '800px';
    host.style.margin = '0 auto';
    host.style.background = '#fff';
    host.style.borderRadius = '8px';
    host.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    host.style.padding = '16px';
    document.querySelector('.post-container')?.appendChild(host);
  }
  return host;
}

async function renderPostView(postId) {
  showUploadSections(false); // Upload-UI verstecken
  const host = ensureViewerHost();

  // Post laden
  const { data: post, error } = await sb
    .from('posts')
    .select('id, user_id, caption, image_path, created_at')
    .eq('id', postId)
    .single();
  if (error || !post) throw error || new Error('Post nicht gefunden');

  // Username laden
  const { data: prof } = await sb
    .from('profiles')
    .select('username')
    .eq('id', post.user_id)
    .single();
  const username = prof?.username ? '@' + prof.username : '@' + post.user_id.slice(0,8);

  const imgUrl = sb.storage.from('images').getPublicUrl(post.image_path).data.publicUrl;

  host.innerHTML = `
    <article class="post" style="border:none; box-shadow:none;">
      <header class="post-header" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <img class="user-avatar" src="assets/img/default-avatar.png" alt="avatar"
             onerror="this.src='assets/img/default-avatar.png'"
             style="width:40px;height:40px;border-radius:50%;object-fit:cover">
        <div class="username" style="font-weight:600">${username}</div>
      </header>

      <div class="post-image" style="width:100%;margin:0 auto 12px;">
        <img src="${imgUrl}" alt="${post.caption || 'Post'}"
             onerror="this.src='assets/img/image-placeholder.png'"
             style="width:100%;height:auto;border-radius:12px;display:block;">
      </div>

      <div class="post-caption" style="margin:8px 4px 0 4px;">
        ${post.caption ? post.caption.replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''}
      </div>

      <div class="post-time" style="color:#6b7280;font-size:.9rem;margin-top:6px;">
        ${new Date(post.created_at).toLocaleString()}
      </div>
    </article>
  `;
}
