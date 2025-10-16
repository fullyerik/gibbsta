"use strict";

/* Modus */
const qs = new URLSearchParams(location.search);
const POST_ID = qs.get("id");

function publicUrl(path){ return sb.storage.from('images').getPublicUrl(path).data.publicUrl; }

const storage = {
  key(scope, id){ return `${scope}_${id}`; },
  read(scope, id){ try{ return JSON.parse(localStorage.getItem(this.key(scope,id))||'[]'); }catch{ return []; } },
  write(scope,id,arr){ localStorage.setItem(this.key(scope,id), JSON.stringify(arr)); }
};

function likeCountOf(postId){ return storage.read('like_counts', postId)[0]?.count || 0; }
function setLikeCount(postId, count){ storage.write('like_counts', postId, [{count}]); }

function getComments(postId){ return storage.read('comments', postId); }
function setComments(postId, arr){ storage.write('comments', postId, arr); }

function getLikeStore(uid){ return storage.read('likes', uid); }
function setLikeStore(uid, arr){ storage.write('likes', uid, arr); }
function getSaveStore(uid){ return storage.read('saved', uid); }
function setSaveStore(uid, arr){ storage.write('saved', uid, arr); }

function isLiked(uid, postId){ return getLikeStore(uid).some(x=>x.postId===postId); }

/* Idempotente Guards (pro User) */
function ensureLiked(uid, postId){
  const arr = getLikeStore(uid);
  if(arr.some(x=>x.postId===postId)) return false;
  arr.push({ postId, at: Date.now() });
  setLikeStore(uid, arr);
  return true;
}
function ensureUnliked(uid, postId){
  const arr = getLikeStore(uid);
  if(!arr.some(x=>x.postId===postId)) return false;
  setLikeStore(uid, arr.filter(x=>x.postId!==postId));
  return true;
}

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.addEventListener('DOMContentLoaded', async () => {
  const user = (await sb.auth.getUser()).data.user;
  if(!user){ location.href='index.html'; return; }

  if(POST_ID){
    document.getElementById('viewSection').classList.remove('hidden');
    await loadPostView(user.id, POST_ID);
  }else{
    document.getElementById('createSection').classList.remove('hidden');
    setupCreate(user.id);
  }
});

/* ---------- VIEW ---------- */
async function loadPostView(currentUserId, pid){
  const { data: rows, error } = await sb
    .from('posts')
    .select('id,user_id,caption,image_path,created_at')
    .eq('id', pid)
    .range(0,0);

  if(error || !rows || !rows[0]){ alert('Beitrag nicht gefunden.'); location.href='home.html'; return; }
  const post = rows[0];

  // Owner-Profil
  let uname = post.user_id.slice(0,8), avatar = 'https://via.placeholder.com/80/dbdbdb/262626?text=+';
  const { data: prof } = await sb
    .from('profiles')
    .select('username, avatar_url, avatar_path')
    .eq('id', post.user_id)
    .range(0,0);
  if(prof && prof[0]){
    uname = prof[0].username || uname;
    avatar = prof[0].avatar_url || (prof[0].avatar_path ? publicUrl(prof[0].avatar_path) : avatar);
  }

  // UI
  const imgUrl = publicUrl(post.image_path);
  const liked = isLiked(currentUserId, post.id);
  const saved = getSaveStore(currentUserId).some(x=>x.postId===post.id);
  const likeCount = likeCountOf(post.id);

  document.getElementById('viewUname').textContent = '@'+uname;
  document.getElementById('viewAvatar').src = avatar;
  const viewImage = document.getElementById('viewImage');
  viewImage.src = imgUrl; viewImage.style.display = 'block';
  document.getElementById('viewCaption').textContent = post.caption || '';

  const likeIcon = document.getElementById('likeBtn').querySelector('i');
  likeIcon.classList.toggle('fa-solid', liked);
  likeIcon.classList.toggle('fa-regular', !liked);
  const saveIcon = document.getElementById('saveBtn').querySelector('i');
  saveIcon.classList.toggle('fa-solid', saved);
  saveIcon.classList.toggle('fa-regular', !saved);

  document.getElementById('likesCount').textContent = likeCount;

  renderComments(post.id);

  // Like (idempotent)
  document.getElementById('likeBtn').onclick = ()=>{
    let cnt = likeCountOf(post.id);

    if(isLiked(currentUserId, post.id)){
      if(ensureUnliked(currentUserId, post.id)){
        cnt = Math.max(0, cnt-1);
        setLikeCount(post.id, cnt);
        likeIcon.classList.remove('fa-solid'); likeIcon.classList.add('fa-regular');
      }
    }else{
      if(ensureLiked(currentUserId, post.id)){
        cnt = cnt+1;
        setLikeCount(post.id, cnt);
        likeIcon.classList.remove('fa-regular'); likeIcon.classList.add('fa-solid');
      }
    }
    document.getElementById('likesCount').textContent = String(cnt);
  };

  // Save
  document.getElementById('saveBtn').onclick = ()=>{
    const already = getSaveStore(currentUserId).some(x=>x.postId===post.id);
    let arr = getSaveStore(currentUserId).filter(x=>x.postId!==post.id);
    if(!already) arr = [...getSaveStore(currentUserId), { postId: post.id, at: Date.now() }];
    setSaveStore(currentUserId, arr);
    saveIcon.classList.toggle('fa-solid', !already);
    saveIcon.classList.toggle('fa-regular', already);
  };

  // Kommentare
  document.getElementById('commentSend').onclick = ()=>{
    const inp = document.getElementById('commentInput');
    const text = (inp.value||'').trim();
    if(!text) return;
    const list = getComments(post.id);
    const fromUser = getViewerName() || 'user';
    list.push({ fromUser, text, at: Date.now() });
    setComments(post.id, list);
    inp.value='';
    renderComments(post.id);
  };

  function getViewerName(){
    try{
      const cu = JSON.parse(sessionStorage.getItem('currentUser')||'{}');
      if(cu.username) return cu.username;
      if(cu.email) return cu.email.split('@')[0];
    }catch{}
    return null;
  }
}

function renderComments(pid){
  const wrap = document.getElementById('commentsList');
  wrap.innerHTML = '';
  const list = getComments(pid);
  list.forEach(c=>{
    const el = document.createElement('div');
    el.innerHTML = `<b>@${escapeHtml(c.fromUser)}</b> ${escapeHtml(c.text)}`;
    wrap.appendChild(el);
  });
}

/* ---------- CREATE ---------- */
function setupCreate(currentUserId){
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('previewImg');
  const publishBtn = document.getElementById('publishBtn');
  const captionEl = document.getElementById('newCaption');
  const charCount = document.getElementById('charCount');
  const msgEl = document.getElementById('uploadMsg');

  dropZone.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', onFile);

  dropZone.addEventListener('dragover', (e)=>{ e.preventDefault(); dropZone.style.background='#fafafa'; });
  dropZone.addEventListener('dragleave', ()=>{ dropZone.style.background='#fff'; });
  dropZone.addEventListener('drop', (e)=>{
    e.preventDefault();
    dropZone.style.background='#fff';
    if(e.dataTransfer.files && e.dataTransfer.files[0]){
      fileInput.files = e.dataTransfer.files; onFile();
    }
  });

  captionEl.addEventListener('input', ()=>{ charCount.textContent = `${captionEl.value.length}/2200`; });

  let chosenFile = null;
  function onFile(){
    const f = fileInput.files?.[0]; if(!f) return;
    chosenFile = f;
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; preview.style.display='block'; };
    reader.readAsDataURL(f);
    publishBtn.disabled = false;
  }

  publishBtn.addEventListener('click', async ()=>{
    if(!chosenFile){ return; }
    try{
      publishBtn.disabled = true;
      msgEl.textContent = 'Lade hoch…';

      const key = `posts/${currentUserId}_${Date.now()}_${(chosenFile.name||'image').replace(/\s+/g,'_')}`;
      const { error: upErr } = await sb.storage.from('images').upload(key, chosenFile, { upsert:true, contentType: chosenFile.type || 'image/jpeg' });
      if(upErr) throw upErr;

      const payload = { user_id: currentUserId, image_path: key, caption: captionEl.value || '', created_at: new Date().toISOString() };
      const { data, error: insErr } = await sb.from('posts').insert(payload).select('id').range(0,0);
      if(insErr) throw insErr;

      const newId = data && data[0] && data[0].id;
      msgEl.textContent = 'Fertig! Öffne Beitrag…';
      location.href = `post.html?id=${encodeURIComponent(newId)}`;
    }catch(e){
      console.error(e);
      msgEl.textContent = 'Fehler: ' + (e.message || e);
      publishBtn.disabled = false;
    }
  });
}
