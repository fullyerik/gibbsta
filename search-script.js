"use strict";

let CU = null; // current auth user
let LAST_RESULTS = [];

document.addEventListener('DOMContentLoaded', async ()=>{
  const { data:{ user } } = await sb.auth.getUser();
  if(!user){ location.href='index.html'; return; }
  CU = user;

  const q = document.getElementById('q');
  const btn = document.getElementById('searchBtn');
  const run = ()=> searchUsers(q.value.trim());

  btn.addEventListener('click', run);
  q.addEventListener('keydown', e=>{ if(e.key==='Enter') run(); });

  // Overlay Back
  document.getElementById('poBack').addEventListener('click', closeProfileOverlay);
});

/* ---------- Suche ---------- */
async function searchUsers(query){
  const list = document.getElementById('results');
  const empty = document.getElementById('empty');
  list.innerHTML = '';

  if(!query){
    empty.textContent = 'Gib oben etwas ein, z. B. @max';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const v = query.replace(/^@/,'');
  const { data, error } = await sb
    .from('profiles')
    .select('id, username, display_name, avatar_url, avatar_path')
    .or(`username.ilike.%${v}%,display_name.ilike.%${v}%`)
    .limit(30);

  if(error){ console.error(error); list.innerHTML = `<p class="empty">Fehler bei der Suche.</p>`; return; }

  LAST_RESULTS = (data||[]).filter(p=>p.id!==CU.id);

  if(LAST_RESULTS.length===0){
    list.innerHTML = `<p class="empty">Keine Treffer.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();
  for(const p of LAST_RESULTS){
    const card = document.createElement('div');
    card.className = 'card';

    const avatar = p.avatar_url || (p.avatar_path ? publicUrl(p.avatar_path) : 'https://via.placeholder.com/80/dbdbdb/262626?text=+');
    const uname = p.username || p.id.slice(0,8);
    const dname = p.display_name || '';

    card.innerHTML = `
      <img class="ava" src="${avatar}" alt="">
      <div class="meta">
        <div class="uname">@${escape(uname)}</div>
        <div class="dname">${escape(dname)}</div>
      </div>
      <button class="follow-btn" data-id="${p.id}">Folgen</button>
    `;

    // Karte öffnet große Profil-Ansicht
    card.addEventListener('click', async (ev)=>{
      if(ev.target && ev.target.classList.contains('follow-btn')) return;
      openProfileOverlay(p);
    });

    // Direct follow/unfollow im Suchresultat
    wireFollowButton(card.querySelector('.follow-btn'), p.id);

    frag.appendChild(card);
  }
  list.appendChild(frag);
}

/* ---------- Große Profil-Ansicht (Overlay) ---------- */
let PO_CURRENT_ID = null;

function closeProfileOverlay(){
  const ov = document.getElementById('profileOverlay');
  ov.style.display = 'none';
  ov.setAttribute('aria-hidden','true');
  PO_CURRENT_ID = null;
}

async function openProfileOverlay(user){
  let userId, base = {};
  if(typeof user === 'string'){ userId = user; }
  else if(user && typeof user === 'object'){ userId = user.id; base = user; }
  PO_CURRENT_ID = userId;

  const ov = document.getElementById('profileOverlay');
  ov.style.display = 'flex';
  ov.setAttribute('aria-hidden','false');

  const avatarBase = base.avatar_url || (base.avatar_path ? publicUrl(base.avatar_path) : null);
  const unameBase  = base.username || (userId?.slice(0,8) || 'user');
  const dnameBase  = base.display_name || unameBase;

  document.getElementById('poUsername').textContent = '@'+unameBase;
  document.getElementById('poDname').textContent = dnameBase;
  document.getElementById('poPhoto').src = avatarBase || 'https://via.placeholder.com/150/dbdbdb/262626?text=+';
  document.getElementById('poBio').textContent = '(keine Bio)';

  try{
    const { data: prof1 } = await sb.from('profiles')
      .select('username, display_name, avatar_url, avatar_path, bio')
      .eq('id', userId).maybeSingle();

    if(prof1){
      const uname = prof1.username || unameBase;
      const dname = prof1.display_name || dnameBase;
      const avatar = prof1.avatar_url || (prof1.avatar_path ? publicUrl(prof1.avatar_path) : avatarBase) || 'https://via.placeholder.com/150/dbdbdb/262626?text=+';
      const bio = (typeof prof1.bio === 'string' && prof1.bio.trim()) ? prof1.bio.trim() : '(keine Bio)';

      document.getElementById('poUsername').textContent = '@'+uname;
      document.getElementById('poDname').textContent = dname;
      document.getElementById('poPhoto').src = avatar;
      document.getElementById('poBio').textContent = bio;
    }
  }catch{
    const { data: prof2 } = await sb.from('profiles')
      .select('username, display_name, avatar_url, avatar_path')
      .eq('id', userId).maybeSingle();

    if(prof2){
      const uname = prof2.username || unameBase;
      const dname = prof2.display_name || dnameBase;
      const avatar = prof2.avatar_url || (prof2.avatar_path ? publicUrl(prof2.avatar_path) : avatarBase) || 'https://via.placeholder.com/150/dbdbdb/262626?text=+';

      document.getElementById('poUsername').textContent = '@'+uname;
      document.getElementById('poDname').textContent = dname;
      document.getElementById('poPhoto').src = avatar;
    }
  }

  const [{ count: postsC }, { count: followersC }, { count: followingC }] = await Promise.all([
    sb.from('posts').select('id', { count:'exact', head:true }).eq('user_id', userId),
    sb.from('follows').select('id', { count:'exact', head:true }).eq('following_id', userId),
    sb.from('follows').select('id', { count:'exact', head:true }).eq('follower_id', userId),
  ]);
  document.getElementById('poPosts').textContent = postsC ?? 0;
  document.getElementById('poFollowers').textContent = followersC ?? 0;
  document.getElementById('poFollowing').textContent = followingC ?? 0;

  const { data: posts } = await sb
    .from('posts')
    .select('id, image_path')
    .eq('user_id', userId)
    .order('created_at', { ascending:false })
    .limit(60);

  const grid = document.getElementById('poGrid');
  grid.innerHTML = '';
  (posts||[]).forEach(p=>{
    const url = publicUrl(p.image_path);
    const tile = document.createElement('div');
    tile.className = 'po-tile';
    tile.innerHTML = `<img src="${url}" alt="">`;
    tile.addEventListener('click', ()=> location.href = 'post.html?id='+encodeURIComponent(p.id));
    grid.appendChild(tile);
  });

  // Follow Button im Overlay (mit sofortigem State)
  wireFollowButton(document.getElementById('poFollowBtn'), userId, {
    onChange: async ()=>{
      const [{ count: followersC2 }] = await Promise.all([
        sb.from('follows').select('id', { count:'exact', head:true }).eq('following_id', userId),
      ]);
      document.getElementById('poFollowers').textContent = followersC2 ?? 0;
    }
  });
}

/* ---------- Folgen / Entfolgen (mit Fallback) ---------- */
async function isFollowing(targetId){
  try{
    const { data, error } = await sb
      .from('follows')
      .select('id')
      .eq('follower_id', CU.id)
      .eq('following_id', targetId)
      .maybeSingle();
    if(error && error.code!=='PGRST116') throw error;
    return !!data;
  }catch{
    const arr = JSON.parse(localStorage.getItem('follows_'+CU.id)||'[]');
    return Array.isArray(arr) && arr.includes(targetId);
  }
}

async function follow(targetId){
  if(targetId===CU.id) return false;
  try{
    const { error } = await sb.from('follows').insert({ follower_id: CU.id, following_id: targetId });
    if(error) throw error;

    // **Mitteilung beim Folgen**
    try{
      await sb.from('notifications').insert({
        owner_id: targetId,
        from_user_id: CU.id,
        type: 'follow'
      });
    }catch(e){ console.warn('follow notification failed', e); }

    return true;
  }catch{
    const arr = new Set(JSON.parse(localStorage.getItem('follows_'+CU.id)||'[]'));
    arr.add(targetId);
    /* FIX: setItem richtig mit 2 Argumenten */
    localStorage.setItem('follows_'+CU.id, JSON.stringify([...arr]));
    return true;
  }
}

async function unfollow(targetId){
  try{
    const { error } = await sb.from('follows')
      .delete()
      .eq('follower_id', CU.id)
      .eq('following_id', targetId);
    if(error) throw error;
    return true;
  }catch{
    const arr = new Set(JSON.parse(localStorage.getItem('follows_'+CU.id)||'[]'));
    arr.delete(targetId);
    /* FIX: setItem richtig mit 2 Argumenten */
    localStorage.setItem('follows_'+CU.id, JSON.stringify([...arr]));
    return true;
  }
}

async function wireFollowButton(btn, targetId, opts={}){
  const setState = (f)=>{ btn.classList.toggle('following', f); btn.textContent = f ? 'Folge ich' : 'Folgen'; };
  setState(await isFollowing(targetId));

  btn.onclick = async (e)=>{
    e.stopPropagation();
    const f = btn.classList.contains('following');
    if(f){ await unfollow(targetId); setState(false); }
    else { await follow(targetId); setState(true); }
    if(typeof opts.onChange === 'function') opts.onChange();
  };
}

/* ---------- Helfer ---------- */
function escape(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
