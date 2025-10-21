/* Home-Feed: Posts + Likes/Kommentare/Speichern + Mitteilungen
   Änderung: Like-Logik idempotent (kein Doppel-Like möglich).
*/

let CURRENT_USER = null;

const storage = {
  key(scope, id){ return `${scope}_${id}`; },
  read(scope, id){ try{ return JSON.parse(localStorage.getItem(this.key(scope,id))||'[]'); }catch{ return []; } },
  write(scope,id,arr){ localStorage.setItem(this.key(scope,id), JSON.stringify(arr)); }
};

/* --- Notifications über Supabase --- */

/* -------- DB Helpers for Likes & Saves (persistent) -------- */
async function fetchUserLikesFor(postIds){
  try{
    const { data, error } = await sb.from('post_likes')
      .select('post_id')
      .eq('user_id', CURRENT_USER.id)
      .in('post_id', postIds);
    if(error) throw error;
    return new Set((data||[]).map(r=>r.post_id));
  }catch(e){
    console.warn('fetchUserLikesFor failed, falling back to local', e);
    return new Set(getLikeStore().map(x=>x.postId));
  }
}

async function fetchUserSavesFor(postIds){
  try{
    const { data, error } = await sb.from('post_saves')
      .select('post_id')
      .eq('user_id', CURRENT_USER.id)
      .in('post_id', postIds);
    if(error) throw error;
    return new Set((data||[]).map(r=>r.post_id));
  }catch(e){
    console.warn('fetchUserSavesFor failed, falling back to local', e);
    return new Set(getSaveStore().map(x=>x.postId));
  }
}

async function fetchLikeCounts(postIds){
  try{
    const { data, error } = await sb.from('post_likes')
      .select('post_id')
      .in('post_id', postIds);
    if(error) throw error;
    const map = new Map();
    for(const row of (data||[])){
      map.set(row.post_id, (map.get(row.post_id)||0)+1);
    }
    return map;
  }catch(e){
    console.warn('fetchLikeCounts failed, using local counts', e);
    const map = new Map();
    for(const id of postIds){
      map.set(id, likeCountOf(id));
    }
    return map;
  }
}

async function toggleLikeDB(postId, ownerId){
  // Returns {liked:boolean, countDelta:+1|-1|0}
  try{
    const { data: existing, error: selErr } = await sb.from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', CURRENT_USER.id)
      .limit(1);
    if(selErr) throw selErr;

    if(existing && existing.length){
      const { error: delErr } = await sb.from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', CURRENT_USER.id);
      if(delErr) throw delErr;
      return { liked: false, countDelta: -1 };
    }else{
      const { error: insErr } = await sb.from('post_likes')
        .insert({ post_id: postId, user_id: CURRENT_USER.id });
      if(insErr) throw insErr;
      // Notification only on like (not on unlike)
      try{
        if (CURRENT_USER?.id && CURRENT_USER.id !== ownerId) {
          await notif.push({
            ownerId: ownerId,
            type: 'like',
            fromUserId: CURRENT_USER.id,
            postId
          });
          await setNavBadge();
        }
      }catch(_){/*noop*/}
      return { liked: true, countDelta: +1 };
    }
  }catch(e){
    console.warn('toggleLikeDB failed, falling back to local', e);
    // local fallback
    const already = isLiked(postId);
    if(already){
      if(unlike(postId)){ return { liked:false, countDelta:-1 }; }
      return { liked:false, countDelta:0 };
    }else{
      if(ensureLiked(postId)){ return { liked:true, countDelta:+1 }; }
      return { liked:true, countDelta:0 };
    }
  }
}

async function toggleSaveDB(postId){
  try{
    const { data: existing, error: selErr } = await sb.from('post_saves')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', CURRENT_USER.id)
      .limit(1);
    if(selErr) throw selErr;

    if(existing && existing.length){
      const { error: delErr } = await sb.from('post_saves')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', CURRENT_USER.id);
      if(delErr) throw delErr;
      return false;
    }else{
      const { error: insErr } = await sb.from('post_saves')
        .insert({ post_id: postId, user_id: CURRENT_USER.id });
      if(insErr) throw insErr;
      return true;
    }
  }catch(e){
    console.warn('toggleSaveDB failed, falling back to local', e);
    const already = getSaveStore().some(x=>x.postId===postId);
    let arr = getSaveStore().filter(x=>x.postId!==postId);
    if(!already){ arr = [...getSaveStore(), {postId, at:Date.now()}]; }
    setSaveStore(arr);
    return !already;
  }
}
const NOTIF_VIA_DB_TRIGGER = true;
const notif = {
  async push({ownerId, type, fromUserId, postId, comment}) {
    if(!ownerId || !fromUserId) return;
    const { error } = await sb.from('notifications').insert({
      owner_id: ownerId,
      from_user_id: fromUserId,
      type,
      post_id: postId || null,
      comment: comment || null
    });
    if(error) console.error('notif.push', error);
  },

  async listForUser(uid){
    const { data, error } = await sb
      .from('notifications')
      .select('id, owner_id, from_user_id, type, post_id, comment, read, created_at')
      .eq('owner_id', uid)
      .order('created_at', { ascending:false });
    if(error){ console.error(error); return []; }
    return data;
  },

  async markAllRead(uid){
    const { error } = await sb.from('notifications')
      .update({ read: true })
      .eq('owner_id', uid);
    if(error) console.error(error);
  },

  async clearAll(uid){
    const { error } = await sb.from('notifications')
      .delete()
      .eq('owner_id', uid);
    if(error) console.error(error);
  },

  async unreadCount(uid){
    const { count, error } = await sb
      .from('notifications')
      .select('*', { count:'exact', head:true })
      .eq('owner_id', uid)
      .eq('read', false);
    return error ? 0 : (count || 0);
  }
};

function publicUrl(path){ return sb.storage.from('images').getPublicUrl(path).data.publicUrl; }
function publicImage(p){ return publicUrl(p.image_path); }

async function getUser(){
  const u = (await sb.auth.getUser()).data.user;
  if(!u){ location.href='index.html'; return null; }
  return u;
}

/* FIX: async + await (vorher Promise → Badge blieb 0) */
async function setNavBadge(){
  if(!CURRENT_USER) return;
  const c = await notif.unreadCount(CURRENT_USER.id);
  const el = document.getElementById('navNotifBadge');
  if(!el) return;
  if(c>0){ el.style.display='flex'; el.textContent = c>99?'99+':String(c); } else { el.style.display='none'; }
}

/* --- Direktnachrichten (DM) über Supabase --- */
const dm = {
  async send({ from, to, text }) {
    if(!from || !to || !text?.trim()) return;
    const { error } = await sb.from('messages').insert({
      from_user_id: from, to_user_id: to, text: text.trim()
    });
    if(error) console.error('dm.send', error);
  },

  async unreadCount(uid){
    const { count, error } = await sb
      .from('messages')
      .select('*', { count:'exact', head:true })
      .eq('to_user_id', uid)
      .eq('read', false);
    return error ? 0 : (count || 0);
  },

  async markThreadRead(me, otherId){
    const { error } = await sb
      .from('messages')
      .update({ read: true })
      .eq('to_user_id', me)
      .eq('from_user_id', otherId)
      .eq('read', false);
    if(error) console.error('dm.markThreadRead', error);
  }
};

/* Badge für Nachrichten in der Topbar */
async function setMsgBadge(){
  if(!CURRENT_USER) return;
  const c = await dm.unreadCount(CURRENT_USER.id);
  const el = document.getElementById('navMsgBadge');
  if(!el) return;
  if(c>0){ el.style.display='flex'; el.textContent = c>99?'99+':String(c); } else { el.style.display='none'; }
}



/* -------- Profilinfos (Username + Avatar) holen (Batch) -------- */
async function fetchProfilesMap(userIds){
  if(!userIds || userIds.length===0) return { byId:{}, fallbackAvatar:'https://via.placeholder.com/48/dbdbdb/262626?text=+' };

  const ids = [...new Set(userIds)];
  const { data: profs } = await sb
    .from('profiles')
    .select('id, username, avatar_url, avatar_path')
    .in('id', ids);

  const map = {};
  for(const p of (profs||[])){
    const avatar = p.avatar_url || (p.avatar_path ? publicUrl(p.avatar_path) : '');
    map[p.id] = {
      username: p.username || p.id?.slice(0,8) || 'user',
      avatar: avatar || 'https://via.placeholder.com/48/dbdbdb/262626?text=+'
    };
  }
  return { byId: map, fallbackAvatar: 'https://via.placeholder.com/48/dbdbdb/262626?text=+' };
}

/* -------- Local Stores (Likes/Saved/Comments/Counts) -------- */
function getLikeStore(){ return storage.read('likes', CURRENT_USER.id); }
function setLikeStore(arr){ storage.write('likes', CURRENT_USER.id, arr); }
function getSaveStore(){ return storage.read('saved', CURRENT_USER.id); }
function setSaveStore(arr){ storage.write('saved', CURRENT_USER.id, arr); }
function getComments(postId){ return storage.read('comments', postId); }
function setComments(postId, arr){ storage.write('comments', postId, arr); }
function likeCountOf(postId){ return storage.read('like_counts', postId)[0]?.count || 0; }
function setLikeCount(postId, count){ storage.write('like_counts', postId, [{count}]); }
function isLiked(postId){ return getLikeStore().some(x=>x.postId===postId); }

/* --- Idempotente Like-Guards --- */
function ensureLiked(postId){
  const arr = getLikeStore();
  if(arr.some(x=>x.postId===postId)) return false; // schon geliked
  arr.push({ postId, at: Date.now() });
  setLikeStore(arr);
  return true;
}
function ensureUnliked(postId){
  const arr = getLikeStore();
  if(!arr.some(x=>x.postId===postId)) return false; // schon unliked
  setLikeStore(arr.filter(x=>x.postId!==postId));
  return true;
}

/* -------- Rendering -------- */
function renderPostCard(p, profInfo, liked, saved, likeCount, comments){
  const username = profInfo?.username || p.user_id.slice(0,8);
  const avatar   = profInfo?.avatar   || 'https://via.placeholder.com/48/dbdbdb/262626?text=+';

  return `
  <article class="post" data-id="${p.id}" data-owner="${p.user_id}">
    <div class="post-header">
      <img class="user-avatar" src="${avatar}" alt="@${username}" onerror="this.src='https://via.placeholder.com/48/dbdbdb/262626?text=+'">
      <div class="username" onclick="location.href='homepage.html?uid=${encodeURIComponent(p.user_id)}'">@${username}</div>
      <button class="more-options" title="Mehr"><i class="fa-solid fa-ellipsis"></i></button>
    </div>

    <div class="post-image" onclick="openPost('${p.id}')">
      <img src="${publicImage(p)}" alt="">
    </div>

    <div class="post-actions">
      <button class="like-btn" title="Like"><i class="${liked?'fa-solid':'fa-regular'} fa-heart"></i></button>
      <button class="comment-btn" title="Kommentieren"><i class="fa-regular fa-comment"></i></button>
      <button class="save-post" title="Speichern"><i class="${saved?'fa-solid':'fa-regular'} fa-bookmark"></i></button>
    </div>

    <div class="post-likes"><span class="likes-count">${likeCount}</span> Likes</div>
    <div class="post-caption">${p.caption? p.caption : ''}</div>

    <div class="post-comments">
      ${comments.slice(0,2).map(c=>`<div><b>@${c.fromUser}</b> ${c.text}</div>`).join('')}
      <button class="view-comments" onclick="openPost('${p.id}')">Alle Kommentare ansehen</button>
    </div>
  </article>`;
}

/* -------- Feed laden -------- */
async function loadFeed(){
  const listEl = document.getElementById('postsContainer');
  if(!listEl) return;
  listEl.innerHTML = '';

  const { data: posts, error } = await sb
    .from('posts')
    .select('id,user_id,caption,image_path,created_at')
    .order('created_at', {ascending:false})
    .limit(50);

  if(error || !posts || posts.length===0){
    document.getElementById('emptyFeed')?.setAttribute('style','display:block');
    return;
  }

  const { byId: profiles, fallbackAvatar } = await fetchProfilesMap(posts.map(p=>p.user_id));
  const postIds = posts.map(p=>p.id);
  const [likedSet, savedSet, likeCountMap] = await Promise.all([
    fetchUserLikesFor(postIds),
    fetchUserSavesFor(postIds),
    fetchLikeCounts(postIds)
  ]);


  const frag = document.createDocumentFragment();
  for(const p of posts){
    const liked     = likedSet.has(p.id);
    const saved     = savedSet.has(p.id);
    const likeCount = likeCountMap.get(p.id) || 0;
    const comments  = getComments(p.id);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPostCard(p, profiles[p.user_id] || { avatar: fallbackAvatar, username: p.user_id.slice(0,8) }, liked, saved, likeCount, comments);
    frag.appendChild(wrapper.firstElementChild);
  }
  listEl.appendChild(frag);

  wireInteractions();
}

/* -------- Interaktionen -------- */
function wireInteractions(){
  document.querySelectorAll('.post').forEach(card=>{
    const postId = card.dataset.id;
    const owner  = card.dataset.owner;

    // Like (DB + Realtime)
    const likeBtn = card.querySelector('.like-btn');
    likeBtn?.addEventListener('click', async ()=>{
      const icon = likeBtn.querySelector('i');
      const countEl = card.querySelector('.likes-count');
      let cnt = parseInt((countEl?.textContent||'0'), 10);

      const res = await toggleLikeDB(postId, owner);
      if(res.countDelta){
        cnt = Math.max(0, cnt + res.countDelta);
        if(countEl) countEl.textContent = String(cnt);
      }
      icon.classList.toggle('fa-solid', res.liked);
      icon.classList.toggle('fa-regular', !res.liked);
    });

    // Speichern
    const saveBtn = card.querySelector('.save-post');
    saveBtn?.addEventListener('click', async ()=>{
      const icon = saveBtn.querySelector('i');
      const nowSaved = await toggleSaveDB(postId);
      icon.classList.toggle('fa-solid', nowSaved);
      icon.classList.toggle('fa-regular', !nowSaved);
    });
    // Kommentare
    const commentBtn = card.querySelector('.comment-btn');
    commentBtn?.addEventListener('click', ()=> openPost(postId));

    // Mehr-Menü
    const moreBtn = card.querySelector('.more-options');
    moreBtn?.addEventListener('click', (e)=>{
      e.stopPropagation();
      const menu = document.createElement('div');
      menu.style.position='absolute';
      menu.style.right='12px';
      menu.style.top = (moreBtn.getBoundingClientRect().bottom + window.scrollY + 8)+'px';
      menu.style.background='#fff';
      menu.style.border='1px solid #dbdbdb';
      menu.style.borderRadius='8px';
      menu.style.boxShadow='0 6px 20px rgba(0,0,0,.12)';
      menu.style.padding='8px';
      menu.innerHTML = `
        <button class="menu-item" onclick="openProfile('${owner}')">Zum Profil</button>
        <button class="menu-item" onclick="alert('Danke für deine Meldung. Unser Team prüft den Beitrag.')">Melden</button>
      `;
      document.body.appendChild(menu);
      const close = ()=>{ menu.remove(); document.removeEventListener('click', close); };
      setTimeout(()=>document.addEventListener('click', close), 0);
    });
  });
}

/* -------- Navigation -------- */
function openPost(id){ location.href = `post.html?id=${encodeURIComponent(id)}`; }
function openProfile(uid){ location.href = `homepage.html?uid=${encodeURIComponent(uid)}`; }

/* --- Live-Update der Likes für einen einzelnen Post --- */
async function updateLikeDisplay(postId){
  try{
    const [likedSet, likeCountMap] = await Promise.all([
      fetchUserLikesFor([postId]),
      fetchLikeCounts([postId])
    ]);
    const liked = likedSet.has(postId);
    const cnt = likeCountMap.get(postId) || 0;
    const card = document.querySelector(`.post[data-id="${postId}"]`);
    if(!card) return;
    const countEl = card.querySelector('.likes-count');
    if(countEl) countEl.textContent = String(cnt);
    const likeBtn = card.querySelector('.like-btn i');
    if(likeBtn){
      likeBtn.classList.toggle('fa-solid', liked);
      likeBtn.classList.toggle('fa-regular', !liked);
    }
  }catch(e){ console.warn('updateLikeDisplay failed', e); }
}

/* -------- Init -------- */
document.addEventListener('DOMContentLoaded', async ()=>{
  CURRENT_USER = await getUser();
  if(!CURRENT_USER) return;

  await setNavBadge();
  await setMsgBadge();     // Badge initial (await!)
  await loadFeed();        // Feed laden

  // Realtime: neue Nachrichten an mich -> Nachrichten-Badge aktualisieren
  try{
    sb.channel('dm_'+CURRENT_USER.id)
      .on('postgres_changes', {event:'*', schema:'public', table:'messages', filter:`to_user_id=eq.${CURRENT_USER.id}`}, async ()=>{
        await setMsgBadge();
      })
      .subscribe();
  }catch(e){ console.warn('Realtime DMs nicht aktiv?', e); }

  // Realtime: Likes → Feed live synchronisieren
  try{
    sb.channel('likes_live_'+CURRENT_USER.id)
      .on('postgres_changes', {event:'*', schema:'public', table:'post_likes'}, async (payload)=>{
        const postId = (payload.new && payload.new.post_id) || (payload.old && payload.old.post_id);
        if(postId) updateLikeDisplay(postId);
      })
      .subscribe();
  }catch(e){ console.warn('Realtime Likes nicht aktiv?', e); }

  // Realtime: Notifications → Nav-Badge sofort aktualisieren
  try{
    sb.channel('notif_'+CURRENT_USER.id)
      .on('postgres_changes', {event:'*', schema:'public', table:'notifications', filter:`owner_id=eq.${CURRENT_USER.id}`}, async ()=>{
        await setNavBadge();
      })
      .subscribe();
  }catch(e){ console.warn('Realtime Notifications nicht aktiv?', e); }

  document.getElementById('foryouBtn')?.addEventListener('click', ()=>location.href='home.html');
  document.getElementById('followingBtn')?.addEventListener('click', ()=>location.href='following.html');

  document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{
    await sb.auth.signOut();
    location.href='index.html';
  });
});
