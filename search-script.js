let activeSearchTab = 'accounts';

function goBack() { history.back(); }

function switchSearchTab(tab) {
  activeSearchTab = tab;
  document.querySelectorAll('.search-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.toLowerCase() === tab);
  });
  handleSearch();
}

async function handleSearch() {
  const term = document.getElementById('searchInput').value.toLowerCase().trim();
  const results = document.getElementById('searchResults');
  results.innerHTML = '';
  if (!term) return;

  // === Suche Accounts ===
  if (activeSearchTab === 'accounts') {
    const { data: users, error } = await sb
      .from('profiles')
      .select('username, display_name, is_verified, avatar_url')
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .limit(20);
    if (error) { console.error(error); return; }

    users.forEach(u => {
      results.innerHTML += `
        <div class="search-result-item">
          <img src="${u.avatar_url || 'default-avatar.png'}" class="search-result-avatar">
          <div class="search-result-info">
            <div class="search-result-username">${u.username} ${u.is_verified ? '✓' : ''}</div>
            <div class="search-result-name">${u.display_name || ''}</div>
          </div>
        </div>`;
    });
  }

  // === Suche Beiträge ===
  else {
    const { data: posts, error } = await sb
      .from('posts')
      .select('id,user_id,caption,image_path,created_at')
      .ilike('caption', `%${term}%`)
      .order('created_at', { ascending:false })
      .limit(30);
    if (error) { console.error(error); return; }

    posts.forEach(p => {
      results.innerHTML += `
        <div class="search-result-item">
          <img src="${publicUrl(p.image_path)}" class="post-preview"
               style="width:44px;height:44px;border-radius:4px;margin-right:12px;object-fit:cover;">
          <div class="search-result-info">
            <div class="search-result-username">@${p.user_id.slice(0,8)}</div>
            <div class="search-result-name">${p.caption || ''}</div>
          </div>
        </div>`;
    });
  }
}
