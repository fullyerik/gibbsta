let activeSearchTab = 'accounts';

function goBack() { history.back(); }

function switchSearchTab(tab) {
  activeSearchTab = tab;
  document.querySelectorAll('.search-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.toLowerCase() === tab);
  });
  handleSearch();
}

// Avatar-Quelle für Accounts (avatar_url bevorzugt, sonst avatar_path aus Storage, sonst Platzhalter)
function avatarFromProfile(u) {
  if (u.avatar_url) return u.avatar_url;
  if (u.avatar_path) return publicUrl(u.avatar_path);
  return 'assets/img/default-avatar.png';
}

async function handleSearch() {
  const termRaw = document.getElementById('searchInput').value;
  const term = termRaw.toLowerCase().trim();
  const results = document.getElementById('searchResults');
  results.innerHTML = '';

  if (!term) {
    results.innerHTML = `<div class="empty">Gib etwas ein, z. B. einen <b>Bildnamen</b> („ferien_bern“), eine <b>Caption</b> oder einen <b>Benutzernamen</b>.</div>`;
    return;
  }

  try {
    if (activeSearchTab === 'accounts') {
      const { data: users, error } = await sb
        .from('profiles')
        .select('username, display_name, is_verified, avatar_url, avatar_path')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(20);
      if (error) throw error;

      if (!users || users.length === 0) {
        results.innerHTML = `<div class="empty">Keine Accounts gefunden.</div>`;
        return;
      }

      users.forEach(u => {
        const avatar = avatarFromProfile(u);
        const verified = u.is_verified ? ' ✓' : '';
        results.insertAdjacentHTML('beforeend', `
          <div class="search-result-item">
            <img src="${avatar}" class="search-result-avatar" alt="${u.username}"
                 onerror="this.src='assets/img/default-avatar.png'">
            <div class="search-result-info">
              <div class="search-result-username">${u.username}${verified}</div>
              <div class="search-result-name">${u.display_name || ''}</div>
            </div>
          </div>
        `);
      });
    } else {
      // Beiträge: Suche in image_name ODER caption
      const { data: posts, error } = await sb
        .from('posts')
        .select('id,user_id,caption,image_path,created_at,image_name')
        .or(`image_name.ilike.%${term}%,caption.ilike.%${term}%`)
        .order('created_at', { ascending:false })
        .limit(30);
      if (error) throw error;

      if (!posts || posts.length === 0) {
        results.innerHTML = `<div class="empty">Keine Beiträge gefunden.</div>`;
        return;
      }

      posts.forEach(p => {
        const img = publicUrl(p.image_path);
        const title = p.image_name || '(ohne Name)';
        const subtitle = p.caption ? p.caption : '';
        results.insertAdjacentHTML('beforeend', `
          <div class="search-result-item">
            <img src="${img}" class="post-preview" alt="${title}"
                 onerror="this.src='assets/img/image-placeholder.png'">
            <div class="search-result-info">
              <div class="search-result-username">${title} · @${p.user_id.slice(0,8)}</div>
              <div class="search-result-name">${subtitle}</div>
            </div>
          </div>
        `);
      });
    }
  } catch (e) {
    console.error('Search error:', e);
    results.innerHTML = `<div class="empty">Fehler bei der Suche: ${e.message || e}</div>`;
  }
}
