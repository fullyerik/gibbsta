document.addEventListener('DOMContentLoaded', function() {
  // Feed Toggle Buttons
  const feedToggles = document.querySelectorAll('.feed-toggle');
  feedToggles.forEach(button => {
    button.addEventListener('click', function() {
      feedToggles.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Profile Button
  const profileBtn = document.getElementById('profileButton');
  if (profileBtn) profileBtn.addEventListener('click', () => window.location.href = 'homepage.html');

  // Bottom Nav
  const navButtons = document.querySelectorAll('.nav-button');
  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      navButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      if (this.querySelector('.fa-home')) window.location.href = 'home.html';
      else if (this.querySelector('.fa-user')) window.location.href = 'homepage.html';
    });
  });

  // Like/Save Toggle (visuell)
  document.querySelectorAll('.post-actions button:first-child').forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('i');
      if (icon.classList.contains('far')) { icon.classList.replace('far','fas'); icon.style.color = '#ed4956'; }
      else { icon.classList.replace('fas','far'); icon.style.color = ''; }
    });
  });
  document.querySelectorAll('.save-post').forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('i');
      if (icon.classList.contains('far')) icon.classList.replace('far','fas');
      else icon.classList.replace('fas','far');
    });
  });

  // === NEU: Posts aus Supabase laden ===
  loadPosts();
});

// Suche (Modal) – falls du es nutzt, kann bleiben
let activeSearchTab = 'accounts';
function openSearchModal() {
  document.getElementById('searchModal').classList.remove('hidden');
  document.getElementById('searchInput').focus();
}
function closeSearchModal() { document.getElementById('searchModal').classList.add('hidden'); }
function switchSearchTab(tab) {
  activeSearchTab = tab;
  document.querySelectorAll('.search-tab').forEach(t => {
    t.classList.toggle('active', t.innerText.toLowerCase() === tab);
  });
}

// === NEU ===
async function loadPosts({ onlyMine = false } = {}) {
  const user = await sbUser();
  let q = sb.from('posts').select('id,user_id,image_path,caption,created_at')
             .order('created_at', { ascending: false });
  if (onlyMine && user) q = q.eq('user_id', user.id);

  const { data: posts, error } = await q;
  if (error) { console.error(error); return; }

  const resultsContainer = document.querySelector('.posts-grid') || document.querySelector('.content');
  const postCountEl = document.getElementById('postCount');
  if (postCountEl) postCountEl.textContent = posts.length;

  const html = posts.map(p => `
    <div class="post">
      <div class="post-header">
        <img src="default-avatar.png" class="user-avatar">
        <div class="username">@${p.user_id.slice(0,8)}</div>
        <button class="more-options">⋯</button>
      </div>
      <div class="post-image"><img src="${publicUrl(p.image_path)}" alt="Post"></div>
      <div class="post-actions">
        <button title="Like"><i class="far fa-heart"></i></button>
        <button title="Kommentieren"><i class="far fa-comment"></i></button>
        <button class="save-post" title="Speichern"><i class="far fa-bookmark"></i></button>
      </div>
      <div class="post-caption"><b>@${p.user_id.slice(0,8)}</b> ${p.caption ?? ''}</div>
      <div class="post-time">${new Date(p.created_at).toLocaleString('de-CH')}</div>
    </div>
  `).join('');

  resultsContainer.innerHTML = html || `
    <div class="no-posts">
      <i class="far fa-image"></i>
      <h2>Keine Beiträge</h2>
      <p>Erstelle deinen ersten Beitrag über das Plus unten.</p>
    </div>`;
}
