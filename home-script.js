/* Feed + Likes/Kommentare/Speichern + Mitteilungen (Home) */

let CURRENT_USER = null;

const storage = {
  key(scope, id){ return `${scope}_${id}`; },
  read(scope, id){ try{ return JSON.parse(localStorage.getItem(this.key(scope,id))||'[]'); }catch{ return []; } },
  write(scope,id,arr){ localStorage.setItem(this.key(scope,id), JSON.stringify(arr)); }
};

const notif = {
  push({ownerId,type,fromUser,postId,postImage,comment}) {
    const list = storage.read('notifications', ownerId);
    list.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      type, fromUser, postId, postImage, comment: comment||'',
      timestamp: new Date().toISOString(),
      read: false
    });
    storage.write('notifications', ownerId, list);
  },
  unreadCount(uid){
    return storage.read('notifications', uid).filter(n=>!n.read).length;
  }
};

async function getUser(){
  const u = (await sb.auth.getUser()).data.user;
  if(!u){ location.href='index.html'; return null; }
  return u;
}

async function usernameOf(userId){
  const { data, error } = await sb.from('profiles').select('username').eq('id', userId).maybeSingle();
  if(error || !data || !data.username) return userId.slice(0,8);
  return data.username;
}

function publicImage(p){ return publicUrl(p.image_path); }

function setNavBadge(){
  if(!CURRENT_USER) return;
  const c = notif.unreadCount(CURRENT_USER.id);
  const el = document.getElementById('navNotifBadge');
  if(c>0){ el.style.display='flex'; el.textContent = c>99?'99+':c; } else { el.style.display='none'; }
}

function renderPostCard(p, username, liked, saved, likeCount, comments){
  return `
  <article class="post" data-id="${p.id}" data-owner="${p.user_id}">
    <div class="post-header">
      <img class="user-avatar" src="assets/img/default-avatar.png" alt="${username}">
      <div class="username">@${username}</div>
      <button class="more-options"><i class="fa-solid fa-ellipsis"></i></button>
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

function getLikeStore(){ return storage.read('likes', CURRENT_USER.id); }
function getSaveStore(){ return storage.read('saved', CURRENT_USER.id); }
function setLikeStore(arr){ storage.write('likes', CURRENT_USER.id, arr); }
function setSaveStore(arr){ storage.write('saved', CURRENT_USER.id, arr); }
function getComments(postId){ return storage.read('comments', postId); }
function setComments(postId, arr){ storage.write('comments', postId, arr); }

function isLiked(postId){ return getLikeStore().some(x=>x.postId===postId); }
function isSaved(postId){ return getSaveStore().some(x=>x.postId===postId); }
function likeCountOf(postId){ return storage.read('like_counts', postId)[0]?.count || 0; }
function setLikeCount(postId, count){ storage.write('like_counts', postId, [{count}]); }

async function loadFeed(){
  const listEl = document.getElementById('postsContainer');
  listEl.innerHTML = '';

  const { data: posts, error } = await sb.from('posts').select('id,user_id,caption,image_path,created_at').order('created_at', {ascending:false}).limit(50);
  if(error){ console.error(error); document.getElementById('emptyFeed').style.display='block'; return; }
  if(!posts || posts.length===0){ document.getElementById('emptyFeed').style.display='block'; return; }

  const uids = [...new Set(posts.map(p=>p.user_id))];
  const { data: profs } = await sb.from('profiles').select('id,username').in('id', uids);
  const nameMap = Object.fromEntries((profs||[]).map(x=>[x.id, x.username||x.id.slice(0,8)]));

  posts.forEach(p=>{
    const liked = isLiked(p.id);
    const saved = isSaved(p.id);
    const likeCount = likeCountOf(p.id);
    const comments = getComments(p.id);
    const html = renderPostCard(p, nameMap[p.user_id]||p.user_id.slice(0,8), liked, saved, likeCount, comments);
    listEl.insertAdjacentHTML('beforeend', html);
  });

  wireEvents();
}

function openPost(id){ location.href = `post.html?id=${encodeURIComponent(id)}`; }

function wireEvents(){
  document.querySelectorAll('.post').forEach(card=>{
    const postId = card.dataset.id;
    const ownerId = card.dataset.owner;
    const img = card.querySelector('.post-image img')?.src || '';

    const likeBtn = card.querySelector('.like-btn');
    const saveBtn = card.querySelector('.save-post');
    const cmtBtn  = card.querySelector('.comment-btn');
    const likeCountEl = card.querySelector('.likes-count');

    likeBtn.onclick = async ()=>{
      const liked = isLiked(postId);
      let likes = getLikeStore();
      let count = likeCountOf(postId);

      const fromUser = (await sb.auth.getUser()).data.user?.user_metadata?.username || 'user';
      if(!liked){
        likes.unshift({postId, imageUrl: img});
        setLikeStore(likes);
        setLikeCount(postId, count+1);
        likeBtn.firstElementChild.classList.remove('fa-regular'); likeBtn.firstElementChild.classList.add('fa-solid');
        likeCountEl.textContent = count+1;

        if(CURRENT_USER.id !== ownerId){
          notif.push({ownerId, type:'like', fromUser, postId, postImage: img});
          setNavBadge();
        }
      }else{
        likes = likes.filter(x=>x.postId!==postId);
        setLikeStore(likes);
        setLikeCount(postId, Math.max(0,count-1));
        likeBtn.firstElementChild.classList.add('fa-regular'); likeBtn.firstElementChild.classList.remove('fa-solid');
        likeCountEl.textContent = Math.max(0,count-1);
      }
    };

    saveBtn.onclick = ()=>{
      const saved = isSaved(postId);
      let saves = getSaveStore();
      if(!saved){
        saves.unshift({postId, imageUrl: img});
        setSaveStore(saves);
        saveBtn.firstElementChild.classList.remove('fa-regular'); saveBtn.firstElementChild.classList.add('fa-solid');
      }else{
        saves = saves.filter(x=>x.postId!==postId);
        setSaveStore(saves);
        saveBtn.firstElementChild.classList.add('fa-regular'); saveBtn.firstElementChild.classList.remove('fa-solid');
      }
    };

    cmtBtn.onclick = ()=>openPost(postId);
  });
}

document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{
  await sb.auth.signOut(); location.href='index.html';
});

(async function init(){
  CURRENT_USER = await getUser();
  if(!CURRENT_USER) return;
  setNavBadge();
  await loadFeed();
})();
